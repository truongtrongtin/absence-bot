import { noPermissionModal } from "@/blocks/no-permission-modal";
import {
  addDays,
  findUserByEmail,
  formatDateInTimezone,
  generateTimeText,
  isWeekendInRange,
} from "@/helpers";
import { getAccessToken } from "@/services/get-acess-token";
import { getUsers } from "@/services/get-users";
import type { DayPart, Env } from "@/types";
import type {
  ViewSubmissionAckHandler,
  ViewSubmissionLazyHandler,
} from "slack-edge";

export const submitNewAbsenceAck: ViewSubmissionAckHandler<Env> = async ({
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
  const now = new Date();

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

  if (startDate > addDays(now, 365)) {
    return {
      response_action: "errors",
      errors: {
        start_date_block: "Must not be later than 1 year from now",
        end_date_block: "",
        day_part_block: "",
      },
    };
  }

  if (endDate > addDays(now, 365)) {
    return {
      response_action: "errors",
      errors: {
        start_date_block: "",
        end_date_block: "Must not be later than 1 year from now",
        day_part_block: "",
      },
    };
  }

  if (!isSingleMode && dayPart !== "full") {
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

export const submitNewAbsence: ViewSubmissionLazyHandler<Env> = async ({
  payload,
  context,
  env,
}) => {
  const view = payload.view;
  const actionUserId = payload.user.id;
  const targetUserId = actionUserId;
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
  const now = new Date();

  if (
    endDate < startDate ||
    (!isSingleMode && dayPart !== "full") ||
    isWeekendInRange(startDate, endDate) ||
    startDate > addDays(now, 365) ||
    endDate > addDays(now, 365)
  ) {
    return;
  }

  const reason = view.state.values["reason_block"]["reason_action"].value || "";
  const [users, { user: slackActionUser }] = await Promise.all([
    getUsers({ env }),
    context.client.users.info({ user: actionUserId }),
  ]);
  const targetUser = findUserByEmail({
    users,
    email: slackActionUser?.profile?.email || "",
  });
  if (!targetUser) {
    await context.client.views.open({
      trigger_id: payload.trigger_id,
      view: noPermissionModal(),
    });
    return;
  }

  const accessToken = await getAccessToken({ env });
  const dayPartText = dayPart === "full" ? "(off)" : `(off ${dayPart})`;
  const summary = `${targetUser["Name"]} ${dayPartText}`;
  const timeText = generateTimeText({ startDate, endDate, dayPart });
  const trimmedReason = reason.trim();
  const messageText = trimmedReason ? ` Reason: ${reason}` : "";

  const newMessage = await context.client.chat.postMessage({
    channel: env.SLACK_CHANNEL,
    text: `<@${targetUserId}> will be absent *${timeText}*.${messageText}`,
  });

  // Create new event on google calendar
  const newEventResponse = await fetch(
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
          date: formatDateInTimezone(addDays(endDate, 1)),
        },
        summary,
        ...(trimmedReason ? { description: trimmedReason } : {}),
        attendees: [
          {
            email: targetUser["Email"],
            responseStatus: "accepted",
          },
        ],
        sendUpdates: "all",
        extendedProperties: {
          private: {
            message_ts: newMessage.message?.ts,
          },
        },
        transparency: "transparent",
      }),
    },
  );

  if (!newEventResponse.ok && newMessage.message?.ts) {
    await context.client.chat.delete({
      channel: env.SLACK_CHANNEL,
      ts: newMessage.message.ts,
    });
  }
};
