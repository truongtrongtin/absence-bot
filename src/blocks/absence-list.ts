import {
  generateTimeText2,
  getDayPartFromEventSummary,
  subDays,
} from "@/helpers";
import type { CalendarEvent } from "@/types";
import type { DividerBlock, HomeTabView, SectionBlock } from "slack-edge";

export function absenceList({
  absenceEvents,
}: {
  absenceEvents: CalendarEvent[];
}): HomeTabView {
  return {
    type: "home",
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*My absences*",
        },
        accessory: {
          type: "button",
          action_id: "back_to_home",
          text: {
            type: "plain_text",
            text: "Back",
            emoji: true,
          },
        },
      },
      {
        type: "divider",
      },
      ...(absenceEvents.length === 0
        ? ([
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: "Nothing to show",
              },
            },
          ] satisfies [SectionBlock])
        : absenceEvents.flatMap((event) => {
            const dayPart = getDayPartFromEventSummary(event.summary);
            const timeText = generateTimeText2({
              startDate: new Date(event.start.date),
              endDate: subDays(new Date(event.end.date), 1),
              dayPart,
            });

            return [
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `*${timeText}*${event.description ? `\n${event.description}` : ""}`,
                  verbatim: true,
                },
                accessory: {
                  type: "overflow",
                  action_id: "show_delete_absence_modal",
                  options: [
                    {
                      text: {
                        type: "plain_text",
                        text: "Delete",
                        emoji: true,
                      },
                      value: JSON.stringify({
                        eventId: event.id,
                        timeText,
                        message_ts:
                          event.extendedProperties?.private?.message_ts || "",
                      }),
                    },
                  ],
                },
              },
              {
                type: "divider",
              },
            ] satisfies [SectionBlock, DividerBlock];
          })),
    ],
  };
}
