import { startOfToday } from "date-fns";
import { BlockActionLazyHandler } from "slack-edge";
import { Env } from "../index";
import { getAccessTokenFromRefreshToken } from "../services/getAccessTokenFromRefreshToken";
import { CalendarEvent, CalendarListResponse } from "../types";
import { findMemberById } from "../helpers";

export const deleteAbsenceFromAppHome: BlockActionLazyHandler<
  "button",
  Env
> = async ({ context, payload, env }) => {
  const { eventId, email } = JSON.parse(payload.actions[0].value);
  const members = JSON.parse(env.MEMBER_LIST_JSON);
  const actionUser = findMemberById({ members, id: payload.user.id });
  if (!actionUser || actionUser.email !== email) {
    await context.client.views.open({
      trigger_id: payload.trigger_id,
      view: {
        type: "modal",
        title: {
          type: "plain_text",
          text: "Unauthorized!",
        },
        close: {
          type: "plain_text",
          text: "Close",
        },
        blocks: [
          {
            type: "section",
            text: {
              type: "plain_text",
              text: "You are not authorized to perform this action!",
            },
          },
        ],
      },
    });
    return;
  }
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
};
