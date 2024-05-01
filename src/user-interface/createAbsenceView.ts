import { format } from "date-fns";
import { AnyDescriptionOption, ModalView } from "slack-edge";
import { AbsencePayload, DayPart } from "../types";

export function createAbsenceView(absencePayload?: AbsencePayload): ModalView {
  const isSingleMode =
    absencePayload?.startDateString === absencePayload?.endDateString;

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
    callback_id: "new-absence-submit",
    // notify_on_close: true,
    // private_metadata: privateMetadata,
    title: {
      type: "plain_text",
      text: "Absence registration",
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
          action_id: "start-date-action",
          focus_on_load: true,
          initial_date:
            absencePayload?.startDateString || format(new Date(), "yyyy-MM-dd"),
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
        block_id: "day-part-block",
        element: {
          type: "radio_buttons",
          initial_option:
            dayPartOptions.find((o) => o.value === absencePayload?.dayPart) ||
            dayPartOptions[0],
          options: dayPartOptions,
          action_id: "day-part-action",
        },
        label: {
          type: "plain_text",
          text: "Day part",
          emoji: true,
        },
      },
      {
        type: "input",
        block_id: "reason-block",
        optional: true,

        element: {
          initial_value: absencePayload?.reason || "",
          type: "plain_text_input",
          action_id: "reason-action",
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
