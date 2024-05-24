import { BlockActionLazyHandler } from "slack-edge";
import { Env } from "..";
import {
  addDays,
  findMemberById,
  formatDate,
  generateTimeText,
} from "../helpers";
import { getAccessTokenFromRefreshToken } from "../services/getAccessTokenFromRefreshToken";
import { DayPart } from "../types";

export const createAbsenceFromSuggestion: BlockActionLazyHandler<
  "button",
  Env
> = async ({ context, payload, env }) => {
  const { targetUserId, startDateString, endDateString, dayPart, reason } =
    JSON.parse(payload.actions[0].value);
  const actionUserId = payload.user.id;

  if (targetUserId !== actionUserId) {
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

  if (!payload.channel || !payload.message) return;
  const channelId = payload.channel.id;
  const threadTs = payload.message.ts;
  const startDate = new Date(startDateString);
  const endDate = new Date(endDateString);
  const members = JSON.parse(env.MEMBER_LIST_JSON);
  const targetUser = findMemberById({ members, id: targetUserId });
  if (!targetUser) throw Error("target user not found");
  const targetUserName = targetUser.name;

  const accessToken = await getAccessTokenFromRefreshToken({ env });
  const dayPartText = dayPart === DayPart.FULL ? "(off)" : `(off ${dayPart})`;
  const summary = `${targetUserName} ${dayPartText}`;
  const timeText = generateTimeText(startDate, endDate, dayPart);
  const trimmedReason = reason.trim();

  const newMessage = await context.client.chat.postMessage({
    channel: channelId,
    thread_ts: threadTs,
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
          date: formatDate(addDays(endDate, 1)),
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
