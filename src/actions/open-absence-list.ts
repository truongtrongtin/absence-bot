import {
  findUserByEmail,
  generateTimeText,
  getDayPartFromEventSummary,
  getToday,
  getUserNameFromEventSummary,
  startOfDay,
  subDays,
} from "@/helpers";
import { getEvents } from "@/services/get-events";
import { getUsers } from "@/services/get-users";
import { Env } from "@/types";
import {
  BlockActionAckHandler,
  BlockActionLazyHandler,
  ButtonAction,
  DividerBlock,
  SectionBlock,
  ViewBlockAction,
} from "slack-edge";

export const openAbsenceListAck: BlockActionAckHandler<
  "button",
  Env,
  ViewBlockAction<ButtonAction>
> = async ({ context, payload }) => {
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

export const openAbsenceList: BlockActionLazyHandler<
  "button",
  Env,
  ViewBlockAction<ButtonAction>
> = async (req) => {
  await openAbsenceListAck(req);
  const { context, payload, env } = req;
  if (!context.actorUserId) return;
  const [users, { user: slackUser }] = await Promise.all([
    getUsers({ env }),
    context.client.users.info({ user: payload.user.id }),
  ]);
  const targetUser = findUserByEmail({
    users,
    email: slackUser?.profile?.email || "",
  });
  if (!targetUser) return;

  // Get future absences from google calendar
  const query = new URLSearchParams({
    timeMin: startOfDay(getToday()).toISOString(),
    q: `${targetUser["Name"]} (off`,
    orderBy: "startTime",
    singleEvents: "true",
  });
  const absenceEvents = await getEvents({ env, query });

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
            action_id: "back_to_home",
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
        ...(absenceEvents.length === 0
          ? ([
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: "Nothing to show",
                },
              },
            ] satisfies [SectionBlock])
          : absenceEvents.flatMap((event) => {
              const dayPart = getDayPartFromEventSummary(event.summary);
              const userName = getUserNameFromEventSummary(event.summary);
              const timeText = generateTimeText(
                new Date(event.start.date),
                subDays(new Date(event.end.date), 1),
                dayPart,
              );

              return [
                {
                  type: "section",
                  text: {
                    type: "mrkdwn",
                    text: `*${userName}*\n${timeText}`,
                    verbatim: true,
                  },
                  accessory: {
                    type: "button",
                    action_id: "delete_absence",
                    text: {
                      type: "plain_text",
                      text: "Delete",
                      emoji: true,
                    },
                    style: "danger",
                    value: JSON.stringify({
                      eventId: event.id,
                      message_ts:
                        event.extendedProperties?.private?.message_ts || "",
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
                },
                {
                  type: "divider",
                },
              ] satisfies [SectionBlock, DividerBlock];
            })),
      ],
    },
  });
};
