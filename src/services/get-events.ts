import { getAccessToken } from "@/services/get-acess-token";
import type { CalendarEvent, CalendarListResponse, Env } from "@/types";

export const getEvents = async ({
  query,
  env,
}: {
  query: URLSearchParams;
  env: Env;
}) => {
  const accessToken = await getAccessToken({ env });
  let events: CalendarEvent[] = [];
  query.set("maxResults", "2500");
  do {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${env.GOOGLE_CALENDAR_ID}/events?${query}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    const data = await response.json<CalendarListResponse>();
    if (!response.ok) throw data;
    events = events.concat(data.items);
    if (data.nextPageToken) {
      query.set("pageToken", data.nextPageToken);
    }
  } while (query.get("pageToken"));
  return events;
};
