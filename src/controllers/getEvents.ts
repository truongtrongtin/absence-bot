import { IRequest, RequestHandler } from "itty-router";
import { getAccessTokenFromRefreshToken } from "../services/getAccessTokenFromRefreshToken";
import { CFArgs, CalendarEvent, CalendarListResponse } from "../types";

export const getEvents: RequestHandler<IRequest, CFArgs> = async (
  request,
  env,
  context
) => {
  const query = new URLSearchParams(request.query as Record<string, string>);
  const accessToken = await getAccessTokenFromRefreshToken({ env });
  let events: CalendarEvent[] = [];
  do {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${env.GOOGLE_CALENDAR_ID}/events?${query}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const data = <CalendarListResponse>await response.json();
    if (!response.ok) throw data;
    events = events.concat(data.items);
    if (data.nextPageToken) {
      query.set("pageToken", data.nextPageToken);
    }
  } while (query.get("pageToken"));
  return events;
};
