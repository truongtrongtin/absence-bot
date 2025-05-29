import { absenceList } from "@/blocks/absence-list";
import { findUserByEmail, getToday, startOfDay } from "@/helpers";
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
    view: absenceList({ absenceEvents }),
  });
};
