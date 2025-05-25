import {
  addDays,
  findUserByEmail,
  formatDate,
  generateTimeText,
} from "@/helpers";
import { getAccessToken } from "@/services/get-acess-token";
import { getUsers } from "@/services/get-users";
import { DayPart, Env } from "@/types";
import {
  BlockActionLazyHandler,
  ButtonAction,
  MessageBlockAction,
} from "slack-edge";

export const createAbsenceFromSuggestion: BlockActionLazyHandler<
  "button",
  Env,
  MessageBlockAction<ButtonAction>
> = async ({ context, payload, env }) => {
  const { targetUserId, startDateString, endDateString, dayPart, reason } =
    JSON.parse(payload.actions[0].value);
  const actionUserId = payload.user.id;
  const [users, { user: slackActionUser }, { user: slackTargetUser }] =
    await Promise.all([
      getUsers({ env }),
      context.client.users.info({ user: actionUserId }),
      context.client.users.info({ user: targetUserId }),
    ]);
  const actionUser = findUserByEmail({
    users,
    email: slackActionUser?.profile?.email || "",
  });

  if (targetUserId !== actionUserId && !actionUser?.["Admin"]) {
    await context.client.views.open({
      trigger_id: payload.trigger_id,
      view: {
        type: "modal",
        title: {
          type: "plain_text",
          text: "Unauthorized!",
        },
        close: {
          type: "plain_text",
          text: "Close",
        },
        blocks: [
          {
            type: "section",
            text: {
              type: "plain_text",
              text: "You are not authorized to perform this action!",
            },
          },
        ],
      },
    });
    return;
  }
  if (!("channel" in payload)) return;
  const channelId = payload.channel.id;
  const threadTs = payload.message.ts;
  const startDate = new Date(startDateString);
  const endDate = new Date(endDateString);
  const targetUser = findUserByEmail({
    users,
    email: slackTargetUser?.profile?.email || "",
  });
  if (!targetUser) throw Error("target user not found");

  const accessToken = await getAccessToken({ env });
  const dayPartText = dayPart === DayPart.FULL ? "(off)" : `(off ${dayPart})`;
  const summary = `${targetUser["Name"]} ${dayPartText}`;
  const timeText = generateTimeText(startDate, endDate, dayPart);
  const trimmedReason = reason.trim();

  const newMessage = await context.client.chat.postMessage({
    channel: channelId,
    thread_ts: threadTs,
    text: `<@${targetUserId}> will be absent *${timeText}*.`,
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
          date: formatDate(addDays(endDate, 1)),
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
