import { addYears, startOfDay } from "date-fns";
import {
  ViewSubmissionAckHandler,
  ViewSubmissionLazyHandler,
} from "slack-edge";
import { findMemberById, generateTimeText, isWeekendInRange } from "../helpers";
import { Env } from "../index";
import { AbsencePayload, DayPart } from "../types";

export const postSuggestionFromModalAckHandler: ViewSubmissionAckHandler =
  async ({ payload }) => {
    const view = payload.view;
    const startDateString =
      view.state.values["start-date-block"]["start-date-action"].selected_date;

    if (!startDateString) {
      return {
        response_action: "errors",
        errors: {
          "start-date-block": "Start date is required",
          "end-date-block": "",
          "day-part-block": "",
        },
      };
    }

    const endDateString =
      view.state.values["end-date-block"]["end-date-action"].selected_date ||
      startDateString;
    const dayPart = view.state.values["day-part-block"]["day-part-action"]
      .selected_option?.value as DayPart;

    const { targetUserId } = JSON.parse(view.private_metadata);
    console.log("targetUserId", targetUserId);
    const isSingleMode = startDateString === endDateString;
    const startDate = new Date(startDateString);
    const endDate = new Date(endDateString);
    const today = startOfDay(new Date());

    const actionUserId = payload.user.id;
    const actionUser = findMemberById(actionUserId);
    if (!actionUser) throw Error("action user not found");
    const actionUserName = actionUser.name;

    const targetUser = findMemberById(targetUserId);
    if (!targetUser) throw Error("member not found");
    const targetUserName = targetUser.name;

    console.log(
      `admin ${actionUserName} is submiting suggestion for ${targetUserName}`
    );

    if (isWeekendInRange(startDate, endDate)) {
      if (isSingleMode) {
        return {
          response_action: "errors",
          errors: {
            "start-date-block": "Not allow weekend",
            "end-date-block": "",
            "day-part-block": "",
          },
        };
      } else {
        return {
          response_action: "errors",
          errors: {
            "start-date-block": "Not allow weekend in range",
            "end-date-block": "Not allow weekend in range",
            "day-part-block": "",
          },
        };
      }
    }

    if (endDate < startDate) {
      return {
        response_action: "errors",
        errors: {
          "start-date-block": "",
          "end-date-block": "Must not be earlier than start date",
          "day-part-block": "",
        },
      };
    }

    if (startDate > addYears(today, 1)) {
      return {
        response_action: "errors",
        errors: {
          "start-date-block": "Must not be later than 1 year from now",
          "end-date-block": "",
          "day-part-block": "",
        },
      };
    }

    if (endDate > addYears(today, 1)) {
      return {
        response_action: "errors",
        errors: {
          "start-date-block": "",
          "end-date-block": "Must not be later than 1 year from now",
          "day-part-block": "",
        },
      };
    }

    if (!isSingleMode && dayPart !== DayPart.FULL) {
      return {
        response_action: "errors",
        errors: {
          "start-date-block": "",
          "end-date-block": "",
          "day-part-block": "This option is not supported in multi-date mode",
        },
      };
    }

    return { response_action: "clear" };
  };

export const postSuggestionFromModal: ViewSubmissionLazyHandler<Env> = async ({
  payload,
  context,
  env,
}) => {
  const view = payload.view;
  const startDateString =
    view.state.values["start-date-block"]["start-date-action"].selected_date;
  if (!startDateString) return;
  const endDateString =
    view.state.values["end-date-block"]["end-date-action"].selected_date ||
    startDateString;
  const dayPart = view.state.values["day-part-block"]["day-part-action"]
    .selected_option?.value as DayPart;

  const { targetUserId, reason, messageTs } = JSON.parse(view.private_metadata);
  const startDate = new Date(startDateString);
  const endDate = new Date(endDateString);

  const actionUserId = payload.user.id;
  const actionUser = findMemberById(actionUserId);
  if (!actionUser) throw Error("action user not found");
  const actionUserName = actionUser.name;

  const targetUser = findMemberById(targetUserId);
  if (!targetUser) throw Error("member not found");
  const targetUserName = targetUser.name;

  console.log(
    `admin ${actionUserName} is submiting suggestion for ${targetUserName}`
  );
  const absencePayload: AbsencePayload = {
    startDateString,
    endDateString,
    dayPart,
    reason,
    targetUserId,
  };
  const timeText = generateTimeText(startDate, endDate, dayPart);
  const text = `<@${targetUser.id}>, are you going to be absent *${timeText}*?`;
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
            action_id: "absence-suggestion-yes",
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
                type: "mrkdwn",
                text: `Do you confirm to be absent ${timeText}?\n The submission will take some time, please be patient.`,
                verbatim: true,
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
            action_id: "absence-new",
            text: {
              type: "plain_text",
              emoji: true,
              text: "No, submit myself",
            },
          },
        ],
      },
    ],
    text,
  });
};
