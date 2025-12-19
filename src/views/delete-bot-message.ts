import { noPermissionModal } from "@/blocks/no-permission-modal";
import { findUserByEmail } from "@/helpers";
import { getUsers } from "@/services/get-users";
import type { Env } from "@/types";
import type { ViewSubmissionLazyHandler } from "slack-edge";

export const deleteBotMessage: ViewSubmissionLazyHandler<Env> = async ({
  payload,
  context,
  env,
}) => {
  const { messageTs } = JSON.parse(payload.view.private_metadata);
  const [users, { user: slackUser }] = await Promise.all([
    getUsers({ env }),
    context.client.users.info({ user: payload.user.id }),
  ]);
  const actionUser = findUserByEmail({
    users,
    email: slackUser?.profile?.email || "",
  });
  if (!actionUser?.["Admin"]) {
    await context.client.views.open({
      trigger_id: payload.trigger_id,
      view: noPermissionModal(),
    });
    return;
  }

  await context.client.chat.delete({
    channel: env.SLACK_CHANNEL,
    ts: messageTs,
  });
};
