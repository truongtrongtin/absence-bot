import { dayPartOptions } from "@/options/day-part-options";
import type { ModalView } from "slack-edge";

export function newSuggestionModal({
  targetUserId,
  reason,
  messageTs,
}: {
  targetUserId: string;
  reason: string;
  messageTs: string;
}): ModalView {
  return {
    type: "modal",
    callback_id: "new_suggestion_submit",
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
        block_id: "start_date_block",
        element: {
          type: "datepicker",
          action_id: "start_date_action",
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
        block_id: "end_date_block",
        optional: true,
        element: {
          type: "datepicker",
          action_id: "end_date_action",
        },
        label: {
          type: "plain_text",
          text: "End date",
          emoji: true,
        },
      },
      {
        type: "input",
        block_id: "day_part_block",
        element: {
          type: "radio_buttons",
          initial_option: dayPartOptions[0],
          options: dayPartOptions,
          action_id: "day_part_action",
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
