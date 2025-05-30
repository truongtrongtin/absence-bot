import { getAccessToken } from "@/services/get-acess-token";
import { getEvents } from "@/services/get-events";
import type { CFArgs } from "@/types";
import type { IRequest, RequestHandler } from "itty-router";

export const migrateEventName: RequestHandler<IRequest, CFArgs> = async (
  request,
  env,
) => {
  const currentName = "Tin";
  const newName = "Tin";
  const searchString = `${currentName} (off`;
  const query = new URLSearchParams({
    q: searchString,
    orderBy: "startTime",
    singleEvents: "true",
  });
  const absenceEvents = await getEvents({ query, env });
  // filter again because q params is a full-text search, not reliable for exact summary matching
  const filteredAbsenceEvents = absenceEvents.filter((event) =>
    event.summary.startsWith(searchString),
  );
  const accessToken = await getAccessToken({ env });

  for (const event of filteredAbsenceEvents) {
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
      },
    );
    const json = await response.json();
    console.log(json);
  }
};
