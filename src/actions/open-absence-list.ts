import { absenceList } from "@/blocks/absence-list";
import { findUserByEmail, getToday } from "@/helpers";
import { getEvents } from "@/services/get-events";
import { getUsers } from "@/services/get-users";
import type { Env } from "@/types";
import type {
  BlockActionLazyHandler,
  ButtonAction,
  ViewBlockAction,
} from "slack-edge";

export const openAbsenceList: BlockActionLazyHandler<
  "button",
  Env,
  ViewBlockAction<ButtonAction>
> = async ({ context, payload, env }) => {
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

  const [users, { user: slackUser }] = await Promise.all([
    getUsers({ env }),
    context.client.users.info({ user: payload.user.id }),
  ]);
  const targetUser = findUserByEmail({
    users,
    email: slackUser?.profile?.email || "",
  });
  if (!targetUser) return;

  const year = getToday().getFullYear();
  const searchString = `${targetUser["Name"]} (off`;
  const query = new URLSearchParams({
    timeMin: new Date(year, 0, 1).toISOString(),
    timeMax: new Date(year + 1, 0, 1).toISOString(),
    q: searchString,
    orderBy: "startTime",
    singleEvents: "true",
  });
  const absenceEvents = await getEvents({ env, query });
  // filter again because q params is a full-text search, not reliable for exact summary matching
  const filteredAbsenceEvents = absenceEvents.filter((event) =>
    event.summary.startsWith(searchString),
  );

  await context.client.views.publish({
    user_id: payload.user.id,
    view: absenceList({
      absenceEvents: filteredAbsenceEvents,
      year,
    }),
  });
};
