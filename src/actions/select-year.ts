import { absenceList } from "@/blocks/absence-list";
import { findUserByEmail } from "@/helpers";
import { getEvents } from "@/services/get-events";
import { getUsers } from "@/services/get-users";
import { type Env } from "@/types";
import type {
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
    view: absenceList({ absenceEvents: filteredAbsenceEvents, year }),
  });
};
