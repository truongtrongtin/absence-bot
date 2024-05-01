import { startOfToday } from "date-fns";
import { EventLazyHandler } from "slack-edge";
import { Env } from "..";
import { getAccessTokenFromRefreshToken } from "../services/getAccessTokenFromRefreshToken";
import { CalendarListResponse } from "../types";
import { appHomeView } from "../user-interface/appHomeView";

export const appHomeOpened: EventLazyHandler<"app_home_opened", Env> = async ({
  context,
  payload,
  env,
}) => {
  const accessToken = await getAccessTokenFromRefreshToken({ env });

  // Get future absences from google calendar
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
  const absenceEvents = eventListObject.items || [];
  await context.client.views.publish({
    user_id: payload.user,
    view: appHomeView(absenceEvents),
  });
};
