import { startOfToday, startOfTomorrow } from "date-fns";
import { SlackAPIClient } from "slack-web-api-client";
import {
  getDayPartFromEventSummary,
  getMemberNameFromEventSummary,
} from "../helpers.js";
import { Env } from "../index.js";
import { CalendarEvent, CalendarListResponse } from "../types.js";
import { getAccessTokenFromRefreshToken } from "./getAccessTokenFromRefreshToken.js";

export const reportTodayAbsences = async ({ env }: { env: Env }) => {
  // If today is Christmas, return
  const today = new Date();
  if (today.getDate() === 25 && today.getMonth() === 11) {
    return;
  }

  const accessToken = await getAccessTokenFromRefreshToken({ env });

  // Get today's absense events
  const queryParams = new URLSearchParams({
    timeMin: startOfToday().toISOString(),
    timeMax: startOfTomorrow().toISOString(),
    q: "off",
    maxResults: "2500",
  });
  const eventListResponse = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${env.GOOGLE_CALENDAR_ID}/events?${queryParams}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const eventListObject = <CalendarListResponse>await eventListResponse.json();
  const absenceEvents = eventListObject.items;

  if (absenceEvents.length === 0) return;

  const client = new SlackAPIClient(env.SLACK_BOT_TOKEN);
  // Post message to Slack
  await client.chat.postMessage({
    channel: env.SLACK_CHANNEL,
    text: `${absenceEvents.length} absences today!`,
    blocks: [
      {
        type: "rich_text",
        elements: [
          {
            type: "rich_text_section",
            elements: [
              {
                type: "text",
                text: "Today's planned absences:\n",
              },
            ],
          },
          {
            type: "rich_text_list",
            style: "bullet",
            elements: absenceEvents.map((event: CalendarEvent) => {
              const memberName = getMemberNameFromEventSummary(event.summary);
              const dayPart = getDayPartFromEventSummary(event.summary);
              return {
                type: "rich_text_section",
                elements: [
                  {
                    type: "text",
                    text: `${memberName}: `,
                  },
                  {
                    type: "text",
                    text: dayPart,
                  },
                ],
              };
            }),
          },
        ],
      },
    ],
  });
};
