import {
  endOfDay,
  getDayPartFromEventSummary,
  getToday,
  getUserNameFromEventSummary,
  startOfDay,
} from "@/helpers";
import { getEvents } from "@/services/get-events";
import { CalendarEvent, Env } from "@/types";
import { SlackAPIClient } from "slack-edge";

export const reportTodayAbsences: ExportedHandlerScheduledHandler<Env> = async (
  controller,
  env,
) => {
  const today = getToday();

  // Get today's absense events
  const query = new URLSearchParams({
    timeMin: startOfDay(today).toISOString(),
    timeMax: endOfDay(today).toISOString(),
    q: "off",
  });
  const absenceEvents = await getEvents({ env, query });
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
                text: "Today's absences:\n",
              },
            ],
          },
          {
            type: "rich_text_list",
            style: "bullet",
            elements: absenceEvents.map((event: CalendarEvent) => {
              const userName = getUserNameFromEventSummary(event.summary);
              const dayPart = getDayPartFromEventSummary(event.summary);
              return {
                type: "rich_text_section",
                elements: [
                  {
                    type: "text",
                    text: `${userName}: `,
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
