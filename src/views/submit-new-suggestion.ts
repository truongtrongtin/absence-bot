import {
  addDays,
  generateTimeText,
  getToday,
  isWeekendInRange,
} from "@/helpers";
import { AbsencePayload, DayPart, Env } from "@/types";
import {
  ViewSubmissionAckHandler,
  ViewSubmissionLazyHandler,
} from "slack-edge";

export const submitNewSuggestionAck: ViewSubmissionAckHandler<Env> = async ({
  payload,
}) => {
  const view = payload.view;
  const startDateString =
    view.state.values["start_date_block"]["start_date_action"].selected_date;

  if (!startDateString) {
    return {
      response_action: "errors",
      errors: {
        start_date_block: "Start date is required",
        end_date_block: "",
        day_part_block: "",
      },
    };
  }

  const endDateString =
    view.state.values["end_date_block"]["end_date_action"].selected_date ||
    startDateString;
  const dayPart = view.state.values["day_part_block"]["day_part_action"]
    .selected_option?.value as DayPart;

  const isSingleMode = startDateString === endDateString;
  const startDate = new Date(startDateString);
  const endDate = new Date(endDateString);
  const today = getToday();

  if (isWeekendInRange(startDate, endDate)) {
    if (isSingleMode) {
      return {
        response_action: "errors",
        errors: {
          start_date_block: "Not allow weekend",
          end_date_block: "",
          day_part_block: "",
        },
      };
    } else {
      return {
        response_action: "errors",
        errors: {
          start_date_block: "Not allow weekend in range",
          end_date_block: "Not allow weekend in range",
          day_part_block: "",
        },
      };
    }
  }

  if (endDate < startDate) {
    return {
      response_action: "errors",
      errors: {
        start_date_block: "",
        end_date_block: "Must not be earlier than start date",
        day_part_block: "",
      },
    };
  }

  if (startDate > addDays(today, 365)) {
    return {
      response_action: "errors",
      errors: {
        start_date_block: "Must not be later than 1 year from now",
        end_date_block: "",
        day_part_block: "",
      },
    };
  }

  if (endDate > addDays(today, 365)) {
    return {
      response_action: "errors",
      errors: {
        start_date_block: "",
        end_date_block: "Must not be later than 1 year from now",
        day_part_block: "",
      },
    };
  }

  if (!isSingleMode && dayPart !== DayPart.FULL) {
    return {
      response_action: "errors",
      errors: {
        start_date_block: "",
        end_date_block: "",
        day_part_block: "This option is not supported in multi-date mode",
      },
    };
  }

  return { response_action: "clear" };
};

export const submitNewSuggestion: ViewSubmissionLazyHandler<Env> = async ({
  payload,
  context,
  env,
}) => {
  const view = payload.view;
  const startDateString =
    view.state.values["start_date_block"]["start_date_action"].selected_date;
  if (!startDateString) return;
  const endDateString =
    view.state.values["end_date_block"]["end_date_action"].selected_date ||
    startDateString;
  const dayPart = view.state.values["day_part_block"]["day_part_action"]
    .selected_option?.value as DayPart;
  const isSingleMode = startDateString === endDateString;
  const startDate = new Date(startDateString);
  const endDate = new Date(endDateString);
  const today = getToday();

  if (
    endDate < startDate ||
    (!isSingleMode && dayPart !== DayPart.FULL) ||
    isWeekendInRange(startDate, endDate) ||
    startDate > addDays(today, 365) ||
    endDate > addDays(today, 365)
  ) {
    return;
  }

  const { targetUserId, reason, messageTs } = JSON.parse(view.private_metadata);
  const absencePayload: AbsencePayload = {
    startDateString,
    endDateString,
    dayPart,
    reason,
    targetUserId,
  };
  const timeText = generateTimeText({ startDate, endDate, dayPart });
  const text = `<@${targetUserId}>, are you going to be absent *${timeText}*?`;
  const quote = reason
    .split("\n")
    .map((text: string) => `>${text}`)
    .join("\n");
  await context.client.chat.postMessage({
    channel: env.SLACK_CHANNEL,
    thread_ts: messageTs,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `${quote}\n${text}`,
          verbatim: true,
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            action_id: "create_absence_from_suggestion",
            text: {
              type: "plain_text",
              emoji: true,
              text: "Yes",
            },
            style: "primary",
            value: JSON.stringify(absencePayload),
            confirm: {
              title: {
                type: "plain_text",
                text: "Absence confirm",
                emoji: true,
              },
              text: {
                type: "plain_text",
                text: `Do you confirm to be absent ${timeText}?\n The submission will take some time, please be patient.`,
              },
              confirm: {
                type: "plain_text",
                text: "Confirm",
                emoji: true,
              },
            },
          },
          {
            type: "button",
            action_id: "open_new_absence_modal",
            text: {
              type: "plain_text",
              emoji: true,
              text: "No, submit myself",
            },
            value: JSON.stringify(absencePayload),
          },
        ],
      },
    ],
    text,
  });
};
