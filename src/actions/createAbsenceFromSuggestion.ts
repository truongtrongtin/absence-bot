import { addDays, findUserById, formatDate, generateTimeText } from "@/helpers";
import { getAccessTokenFromRefreshToken } from "@/services/getAccessTokenFromRefreshToken";
import { getUsers } from "@/services/getUsers";
import { DayPart, Env } from "@/types";
import { BlockActionLazyHandler } from "slack-edge";

export const createAbsenceFromSuggestion: BlockActionLazyHandler<
  "button",
  Env
> = async ({ context, payload, env }) => {
  const { targetUserId, startDateString, endDateString, dayPart, reason } =
    JSON.parse(payload.actions[0].value);
  const actionUserId = payload.user.id;
  const users = await getUsers({ env });
  const actionUser = findUserById({ users, id: actionUserId });

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
  const targetUser = findUserById({ users, id: targetUserId });
  if (!targetUser) throw Error("target user not found");

  const accessToken = await getAccessTokenFromRefreshToken({ env });
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
    }
  );

  if (!newEventResponse.ok && newMessage.message?.ts) {
    await context.client.chat.delete({
      channel: env.SLACK_CHANNEL,
      ts: newMessage.message.ts,
    });
  }
};
