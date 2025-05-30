import { leaveBalanceModal } from "@/blocks/leave-balance-modal";
import {
  findUserByEmail,
  getDayPartFromEventSummary,
  getToday,
} from "@/helpers";
import { getEvents } from "@/services/get-events";
import { getUsers } from "@/services/get-users";
import type { Env } from "@/types";
import type {
  BlockActionLazyHandler,
  ButtonAction,
  ViewBlockAction,
} from "slack-edge";

export const openLeaveBalanceModal: BlockActionLazyHandler<
  "button",
  Env,
  ViewBlockAction<ButtonAction>
> = async ({ context, payload, env }) => {
  const [users, { user: slackUser }] = await Promise.all([
    getUsers({ env }),
    context.client.users.info({ user: payload.user.id }),
  ]);
  const targetUser = findUserByEmail({
    users,
    email: slackUser?.profile?.email || "",
  });
  if (!targetUser) return;

  const currentYear = getToday().getFullYear();
  const searchString = `${targetUser["Name"]} (off`;
  const query = new URLSearchParams({
    timeMin: new Date(currentYear, 0, 1).toISOString(),
    timeMax: new Date(currentYear + 1, 0, 1).toISOString(),
    q: searchString,
    orderBy: "startTime",
    singleEvents: "true",
  });
  const absenceEvents = await getEvents({ env, query });
  let count = 0;
  for (const event of absenceEvents) {
    // filter again because q params is a full-text search, not reliable for exact summary matching
    if (!event.summary.startsWith(searchString)) continue;
    const dayPart = getDayPartFromEventSummary(event.summary);
    count +=
      dayPart === "full"
        ? Math.floor(
            (new Date(event.start.date).getTime() -
              new Date(event.end.date).getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : 0.5;
  }

  await context.client.views.open({
    trigger_id: payload.trigger_id,
    view: leaveBalanceModal({
      remainingDays: targetUser["Balance"] - count,
    }),
  });
};
