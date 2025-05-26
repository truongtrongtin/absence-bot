import { absenceList } from "@/blocks/absence-list";
import { findUserByEmail } from "@/helpers";
import { getEvents } from "@/services/get-events";
import { getUsers } from "@/services/get-users";
import { Env } from "@/types";
import {
  BlockActionLazyHandler,
  StaticSelectAction,
  ViewBlockAction,
} from "slack-edge";

export const selectYear: BlockActionLazyHandler<
  "static_select",
  Env,
  ViewBlockAction<StaticSelectAction>
> = async ({ context, payload, env }) => {
  const year = Number(payload.actions[0].selected_option.value);
  const [users, { user: slackUser }] = await Promise.all([
    getUsers({ env }),
    context.client.users.info({ user: payload.user.id }),
  ]);
  const targetUser = findUserByEmail({
    users,
    email: slackUser?.profile?.email || "",
  });
  if (!targetUser) return;

  const query = new URLSearchParams({
    timeMin: new Date(year, 0, 1).toISOString(),
    timeMax: new Date(year + 1, 0, 1).toISOString(),
    q: `${targetUser["Name"]} (off`,
    orderBy: "startTime",
    singleEvents: "true",
  });
  const absenceEvents = await getEvents({ env, query });

  await context.client.views.publish({
    user_id: payload.user.id,
    view: absenceList({ absenceEvents, year }),
  });
};
