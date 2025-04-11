import {
  findUserById,
  generateTimeText,
  getDayPartFromEventSummary,
  getToday,
  getUserNameFromEventSummary,
  startOfDay,
  subDays,
} from "@/helpers";
import { getEvents } from "@/services/getEvents";
import { getUsers } from "@/services/getUsers";
import { Env } from "@/types";
import {
  AnyHomeTabBlock,
  BlockActionAckHandler,
  BlockActionLazyHandler,
} from "slack-edge";

export const showAbsenceListLoader: BlockActionAckHandler<"button"> = async ({
  context,
  payload,
}) => {
  await context.client.views.publish({
    user_id: payload.user.id,
    view: {
      type: "home",
      blocks: [
        {
          type: "section",
          text: {
            type: "plain_text",
            text: "Loading...",
            emoji: true,
          },
        },
      ],
    },
  });
};

export const showAbsenceList: BlockActionLazyHandler<"button", Env> = async (
  req
) => {
  await showAbsenceListLoader(req);
  const { context, payload, env } = req;
  if (!context.actorUserId) return;
  const users = await getUsers({ env });
  const targetUser = findUserById({ users, id: context.actorUserId });
  if (!targetUser) return;

  // Get future absences from google calendar
  const query = new URLSearchParams({
    timeMin: startOfDay(getToday()).toISOString(),
    q: `${targetUser["Name"]} (off`,
    orderBy: "startTime",
    singleEvents: "true",
  });
  const absenceEvents = await getEvents({ env, query });

  const absenceBlocks: AnyHomeTabBlock[] = [];
  for (const event of absenceEvents) {
    const dayPart = getDayPartFromEventSummary(event.summary);
    const userName = getUserNameFromEventSummary(event.summary);
    const timeText = generateTimeText(
      new Date(event.start.date),
      subDays(new Date(event.end.date), 1),
      dayPart
    );
    absenceBlocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${userName}*\n${timeText}`,
        verbatim: true,
      },
      accessory: {
        type: "button",
        action_id: "app-home-absence-delete",
        text: {
          type: "plain_text",
          text: "Delete",
          emoji: true,
        },
        style: "danger",
        value: JSON.stringify({
          eventId: event.id,
          message_ts: event.extendedProperties?.private?.message_ts || "",
        }),
        confirm: {
          title: {
            type: "plain_text",
            text: "Delete absence",
            emoji: true,
          },
          text: {
            type: "plain_text",
            text: "Are you sure you want to delete this absence? This cannot be undone.",
          },
          confirm: {
            type: "plain_text",
            text: "Delete",
            emoji: true,
          },
          style: "danger",
        },
      },
    });
    absenceBlocks.push({
      type: "divider",
    });
  }
  if (absenceEvents.length === 0) {
    absenceBlocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: "Nothing to show",
      },
    });
  }

  await context.client.views.publish({
    user_id: payload.user.id,
    view: {
      type: "home",
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*My absences*",
          },
          accessory: {
            type: "button",
            action_id: "back-to-home",
            text: {
              type: "plain_text",
              text: "Back",
              emoji: true,
            },
          },
        },
        {
          type: "divider",
        },
        ...absenceBlocks,
      ],
    },
  });
};
