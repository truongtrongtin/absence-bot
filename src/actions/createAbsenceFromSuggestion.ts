import { addDays, format } from "date-fns";
import { BlockActionLazyHandler } from "slack-edge";
import { Env } from "..";
import { findMemberById, generateTimeText } from "../helpers";
import { getAccessTokenFromRefreshToken } from "../services/getAccessTokenFromRefreshToken";
import { DayPart } from "../types";

export const createAbsenceFromSuggestion: BlockActionLazyHandler<
  "button",
  Env
> = async ({ context, payload, body, env }) => {
  if (!payload.channel || !payload.message) return;
  const {
    targetUserId,
    startDateString,
    endDateString,
    dayPart,
    reason,
    showReason,
  } = JSON.parse(body.value);
  const actionUserId = payload.user.id;
  const channelId = payload.channel.id;
  const threadTs = payload.message.ts;

  const startDate = new Date(startDateString);
  const endDate = new Date(endDateString);
  const actionUser = findMemberById(actionUserId);
  if (!actionUser) throw Error("action user not found");
  const actionUserName = actionUser.name;
  const isAdmin = actionUser.admin;

  if (targetUserId !== actionUserId && !isAdmin) {
    await context.client.chat.postEphemeral({
      channel: channelId,
      user: actionUserId,
      text: ":x: You are not authorized to perform this action!",
    });
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
  const messageText =
    showReason === "true" && trimmedReason ? ` Reason: ${reason}` : "";

  const newMessage = await context.client.chat.postMessage({
    channel: channelId,
    text: `<@${targetUserId}> will be absent *${timeText}*.${messageText}`,
    ...(threadTs ? { thread_ts: threadTs } : {}),
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
