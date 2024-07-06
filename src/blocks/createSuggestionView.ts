import { formatDate, getToday } from "@/helpers";
import { DayPart } from "@/types";
import { AnyDescriptionOption, ModalView } from "slack-edge";

export function createSuggestionView(
  targetUserId: string,
  reason: string,
  messageTs: string
): ModalView {
  const dayPartOptions: AnyDescriptionOption[] = [
    {
      text: {
        type: "plain_text",
        text: ":beach_with_umbrella: Full",
        emoji: true,
      },
      value: DayPart.FULL,
    },
    {
      text: {
        type: "plain_text",
        text: `:sunny: Morning`,
        emoji: true,
      },
      value: DayPart.MORNING,
    },
    {
      text: {
        type: "plain_text",
        text: ":city_sunset: Afternoon",
        emoji: true,
      },
      value: DayPart.AFTERNOON,
    },
  ];

  return {
    type: "modal",
    callback_id: "new-suggestion-submit",
    // notify_on_close: true,
    private_metadata: JSON.stringify({ targetUserId, reason, messageTs }),
    title: {
      type: "plain_text",
      text: "Suggestion submit",
    },
    submit: {
      type: "plain_text",
      text: "Submit",
      emoji: true,
    },
    close: {
      type: "plain_text",
      text: "Cancel",
      emoji: true,
    },
    blocks: [
      {
        type: "input",
        block_id: "start-date-block",
        element: {
          type: "datepicker",
          initial_date: formatDate(getToday()),
          action_id: "start-date-action",
          focus_on_load: true,
        },
        label: {
          type: "plain_text",
          text: "Start date",
          emoji: true,
        },
      },
      {
        type: "input",
        block_id: "end-date-block",
        optional: true,
        element: {
          type: "datepicker",
          action_id: "end-date-action",
        },
        label: {
          type: "plain_text",
          text: "End date",
          emoji: true,
        },
      },
      {
        type: "input",
        block_id: "day-part-block",
        element: {
          type: "radio_buttons",
          initial_option: dayPartOptions[0],
          options: dayPartOptions,
          action_id: "day-part-action",
        },
        label: {
          type: "plain_text",
          text: "Day part",
          emoji: true,
        },
      },
    ],
  };
}
