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
  const query = new URLSearchParams({
    timeMin: new Date(currentYear, 0, 1).toISOString(),
    timeMax: new Date(currentYear + 1, 0, 1).toISOString(),
    q: `${targetUser["Name"]} (off`,
    orderBy: "startTime",
    singleEvents: "true",
  });
  const absenceEvents = await getEvents({ env, query });
  let count = 0;
  for (const event of absenceEvents) {
    const startDate = new Date(event.start.date);
    const endDate = new Date(event.end.date);
    const dayPart = getDayPartFromEventSummary(event.summary);
    count += dayPart === "full" ? endDate.getDate() - startDate.getDate() : 0.5;
  }

  await context.client.views.open({
    trigger_id: payload.trigger_id,
    view: leaveBalanceModal({
      remainingDays: targetUser["Balance"] - count,
    }),
  });
};
