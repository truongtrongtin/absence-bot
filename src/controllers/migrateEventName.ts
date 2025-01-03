import { getAccessTokenFromRefreshToken } from "@/services/getAccessTokenFromRefreshToken";
import { getEvents } from "@/services/getEvents";
import { CFArgs } from "@/types";
import { IRequest, RequestHandler } from "itty-router";

export const migrateEventName: RequestHandler<IRequest, CFArgs> = async (
  request,
  env,
  context
) => {
  const currentName = "Tin";
  const newName = "Tin";
  const query = new URLSearchParams({
    q: `${currentName} (off`,
    orderBy: "startTime",
    singleEvents: "true",
  });
  const events = await getEvents({ query, env });
  const accessToken = await getAccessTokenFromRefreshToken({ env });

  for (const event of events) {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${env.GOOGLE_CALENDAR_ID}/events/${event.id}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summary: event.summary.replace(currentName, newName),
        }),
      }
    );
    const json = await response.json();
    console.log(json);
  }
};
