import { startOfToday } from "date-fns";
import { BlockActionLazyHandler } from "slack-edge";
import { findMemberById } from "../helpers";
import { Env } from "../index";
import { getAccessTokenFromRefreshToken } from "../services/getAccessTokenFromRefreshToken";
import { CalendarEvent, CalendarListResponse } from "../types";
import { appHomeView } from "../user-interface/appHomeView";

export const deleteAbsenceFromAppHome: BlockActionLazyHandler<
  "button",
  Env
> = async ({ context, payload, env }) => {
  const eventId = payload.actions[0].block_id;
  const foundMember = findMemberById(payload.user.id);
  if (!foundMember) throw Error("member not found");
  console.log(`${foundMember.name} is deleting absence`);

  const accessToken = await getAccessTokenFromRefreshToken({ env });

  // Get absence event from google calendar
  const eventResponse = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${env.GOOGLE_CALENDAR_ID}/events/${eventId}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const eventObject = <CalendarEvent>await eventResponse.json();

  const startDate = eventObject.start.date;
  if (
    new Date(startDate).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0)
  ) {
    return;
  }

  // Delete absence event from google calendar
  await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${env.GOOGLE_CALENDAR_ID}/events/${eventId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  const message_ts = eventObject.extendedProperties.private.message_ts;
  if (message_ts) {
    // Delete announced message
    await context.client.chat.delete({
      channel: env.SLACK_CHANNEL,
      ts: message_ts,
    });
  }

  // Get events from google calendar
  const queryParams = new URLSearchParams({
    timeMin: startOfToday().toISOString(),
    q: "off",
    orderBy: "startTime",
    singleEvents: "true",
    maxResults: "2500",
  });
  const eventListResponse = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${env.GOOGLE_CALENDAR_ID}/events?${queryParams}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const eventListObject = <CalendarListResponse>await eventListResponse.json();
  const absenceEvents = eventListObject.items;

  // Update app home
  await context.client.views.publish({
    user_id: payload.view!.id,
    view: appHomeView(absenceEvents, payload.user.id),
  });
};
