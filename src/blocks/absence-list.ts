import {
  generateTimeText2,
  getDayPartFromEventSummary,
  getToday,
  subDays,
} from "@/helpers";
import { getYearOptions } from "@/options/year-options";
import type { CalendarEvent } from "@/types";
import type { DividerBlock, HomeTabView, SectionBlock } from "slack-edge";

export function absenceList({
  absenceEvents,
  year,
}: {
  absenceEvents: CalendarEvent[];
  year: number;
}): HomeTabView {
  const today = getToday();
  const yearOptions = getYearOptions();
  const yearOption = yearOptions.find((o) => o.value === year?.toString());
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
        type: "actions",
        block_id: "year_block",
        elements: [
          {
            type: "static_select",
            action_id: "select_year",
            options: yearOptions,
            initial_option: yearOption,
            placeholder: {
              type: "plain_text",
              text: "Filter by year",
              emoji: true,
            },
          },
        ],
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
            const startDate = new Date(event.start.date);
            const endDate = subDays(new Date(event.end.date), 1);
            const timeText = generateTimeText2({ startDate, endDate, dayPart });

            return [
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `*${timeText}*\n${event.description ? `_${event.description}_` : "⠀"}`,
                  verbatim: true,
                },
                accessory:
                  today < new Date(event.end.date)
                    ? {
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
                                event.extendedProperties?.private?.message_ts ||
                                "",
                              year,
                            }),
                          },
                        ],
                      }
                    : undefined,
              },
              {
                type: "divider",
              },
            ] satisfies [SectionBlock, DividerBlock];
          })),
    ],
  };
}
