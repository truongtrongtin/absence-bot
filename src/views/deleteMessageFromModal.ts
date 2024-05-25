import { ViewSubmissionLazyHandler } from "slack-edge";
import { Env } from "../types";

export const deleteMessageFromModal: ViewSubmissionLazyHandler<Env> = async ({
  payload: { view },
  context,
  env,
}) => {
  const { messageTs } = JSON.parse(view.private_metadata);
  await context.client.chat.delete({
    channel: env.SLACK_CHANNEL,
    ts: messageTs,
  });
};
