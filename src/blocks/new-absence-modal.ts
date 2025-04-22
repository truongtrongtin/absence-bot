import { dayPartOptions } from "@/blocks/day-part-options";
import { formatDate, getToday } from "@/helpers";
import { AbsencePayload } from "@/types";
import { ModalView } from "slack-edge";

export function newAbsenceModal(absencePayload?: AbsencePayload): ModalView {
  const isSingleMode =
    absencePayload?.startDateString === absencePayload?.endDateString;

  return {
    type: "modal",
    callback_id: "new_absence_submit",
    // notify_on_close: true,
    // private_metadata: privateMetadata,
    title: {
      type: "plain_text",
      text: "New Absence",
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
          initial_date:
            absencePayload?.startDateString || formatDate(getToday()),
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
          ...(absencePayload?.endDateString && !isSingleMode
            ? { initial_date: absencePayload.endDateString }
            : {}),
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
          initial_option:
            dayPartOptions.find((o) => o.value === absencePayload?.dayPart) ||
            dayPartOptions[0],
          options: dayPartOptions,
          action_id: "day_part_action",
        },
        label: {
          type: "plain_text",
          text: "Day part",
          emoji: true,
        },
      },
      {
        type: "input",
        block_id: "reason_block",
        optional: true,

        element: {
          initial_value: absencePayload?.reason || "",
          type: "plain_text_input",
          action_id: "reason_action",
          placeholder: {
            type: "plain_text",
            text: "Share your reason",
            emoji: true,
          },
        },
        label: {
          type: "plain_text",
          text: "Reason",
          emoji: true,
        },
      },
    ],
  };
}
