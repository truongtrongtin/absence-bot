import { addDays, addYears, format, startOfDay } from "date-fns";
import {
  ViewSubmissionAckHandler,
  ViewSubmissionLazyHandler,
} from "slack-edge";
import { findMemberById, generateTimeText, isWeekendInRange } from "../helpers";
import { Env } from "../index";
import { getAccessTokenFromRefreshToken } from "../services/getAccessTokenFromRefreshToken";
import { DayPart } from "../types";

export const createAbsenceFromModalAckHandler: ViewSubmissionAckHandler =
  async ({ payload }) => {
    const view = payload.view;
    const startDateString =
      view.state.values["start-date-block"]["start-date-action"].selected_date;
    if (!startDateString) {
      return {
        response_action: "errors",
        errors: {
          member_block: "",
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

    const isSingleMode = startDateString === endDateString;
    const startDate = new Date(startDateString);
    const endDate = new Date(endDateString);
    const today = startOfDay(new Date());

    const actionUserId = payload.user.id;
    const actionUser = findMemberById(actionUserId);
    if (!actionUser) throw Error("action user not found");
    const actionUserName = actionUser.name;
    const isAdmin = actionUser.admin;

    const targetUserId =
      view.state.values?.["member-block"]?.["member-action"]?.selected_user ||
      "";

    let targetUser = actionUser;
    if (isAdmin) {
      if (!targetUserId) {
        return {
          response_action: "errors",
          errors: {
            member_block: "Member is required",
            "start-date-block": "",
            "end-date-block": "",
            "day-part-block": "",
          },
        };
      }
      const foundUser = findMemberById(targetUserId);
      if (!foundUser) throw Error("target user not found");
      targetUser = foundUser;
    }
    const targetUserName = targetUser.name;
    if (!isAdmin && actionUser.id === targetUser.id) {
      console.log(`${actionUserName} is submiting absence`);
    } else {
      console.log(
        `admin ${actionUserName} is submiting absence for ${targetUserName}`
      );
    }

    if (!isAdmin && startDate < today) {
      return {
        response_action: "errors",
        errors: {
          member_block: "",
          "start-date-block": "Not allow day in the past",
          "end-date-block": "",
          "day-part-block": "",
        },
      };
    }

    if (isWeekendInRange(startDate, endDate)) {
      if (isSingleMode) {
        return {
          response_action: "errors",
          errors: {
            member_block: "",
            "start-date-block": "Not allow weekend",
            "end-date-block": "",
            "day-part-block": "",
          },
        };
      } else {
        return {
          response_action: "errors",
          errors: {
            member_block: "",
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
          member_block: "",
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
          member_block: "",
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
          member_block: "",
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
          member_block: "",
          "start-date-block": "",
          "end-date-block": "",
          "day-part-block": "This option is not supported in multi-date mode",
        },
      };
    }

    return { response_action: "clear" };
  };

export const createAbsenceFromModal: ViewSubmissionLazyHandler<Env> = async ({
  payload,
  context,
  env,
}) => {
  const view = payload.view;
  const actionUserId = payload.user.id;
  const targetUserId =
    view.state.values?.["member-block"]?.["member-action"]?.selected_user || "";
  const startDateString =
    view.state.values["start-date-block"]["start-date-action"].selected_date;
  if (!startDateString) return;
  const endDateString =
    view.state.values["end-date-block"]["end-date-action"].selected_date ||
    startDateString;
  const dayPart = view.state.values["day-part-block"]["day-part-action"]
    .selected_option?.value as DayPart;
  const reason = view.state.values["reason-block"]["reason-action"].value || "";
  const startDate = new Date(startDateString);
  const endDate = new Date(endDateString);
  const actionUser = findMemberById(actionUserId);
  if (!actionUser) throw Error("action user not found");
  const actionUserName = actionUser.name;
  const isAdmin = actionUser.admin;

  if (targetUserId !== actionUserId && !isAdmin) {
    await context.client.chat.postEphemeral({
      channel: env.SLACK_CHANNEL,
      user: actionUserId,
      text: ":x: You are not authorized to perform this action!",
    });
    return;
  }

  const targetUser = findMemberById(targetUserId);
  if (!targetUser) throw Error("target user not found");
  const targetUserName = targetUser.name;

  if (!isAdmin && actionUser.id === targetUser.id) {
    console.log(`${actionUserName} is submiting absence`);
  } else {
    console.log(
      `admin ${actionUserName} is submiting absence for ${targetUserName}`
    );
  }

  const accessToken = await getAccessTokenFromRefreshToken({ env });
  const dayPartText = dayPart === DayPart.FULL ? "(off)" : `(off ${dayPart})`;
  const summary = `${targetUserName} ${dayPartText}`;
  const timeText = generateTimeText(startDate, endDate, dayPart);
  const trimmedReason = reason.trim();

  const newMessage = await context.client.chat.postMessage({
    channel: env.SLACK_CHANNEL,
    text: `<@${targetUserId}> will be absent *${timeText}*.`,
  });

  // Create new event on google calendar
  await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${env.GOOGLE_CALENDAR_ID}/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        start: {
          date: startDateString,
        },
        end: {
          date: format(addDays(endDate, 1), "yyyy-MM-dd"),
        },
        summary,
        attendees: [
          {
            email: targetUser.email,
            responseStatus: "accepted",
          },
        ],
        sendUpdates: "all",
        extendedProperties: {
          private: {
            message_ts: newMessage.message?.ts,
            ...(trimmedReason ? { reason: trimmedReason } : {}),
          },
        },
        transparency: "transparent",
      }),
    }
  );
};
