import { findMemberById } from "@/helpers";
import { getUsers } from "@/services/getUsers";
import { Env } from "@/types";
import { ViewSubmissionLazyHandler } from "slack-edge";

export const deleteMessageFromModal: ViewSubmissionLazyHandler<Env> = async ({
  payload,
  context,
  env,
}) => {
  const { messageTs } = JSON.parse(payload.view.private_metadata);
  const members = await getUsers({ env });
  const actionMember = findMemberById({ members, id: payload.user.id });
  if (!actionMember?.["Admin"]) {
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
