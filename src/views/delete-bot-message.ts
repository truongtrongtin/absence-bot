import { findUserByEmail } from "@/helpers";
import { getUsers } from "@/services/get-users";
import { Env } from "@/types";
import { ViewSubmissionLazyHandler } from "slack-edge";

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
      view: {
        type: "modal",
        title: {
          type: "plain_text",
          text: "Unauthorized!",
        },
        close: {
          type: "plain_text",
          text: "Close",
        },
        blocks: [
          {
            type: "section",
            text: {
              type: "plain_text",
              text: "You are not authorized to perform this action!",
            },
          },
        ],
      },
    });
    return;
  }

  await context.client.chat.delete({
    channel: env.SLACK_CHANNEL,
    ts: messageTs,
  });
};
