import { EventLazyHandler } from "slack-edge";
import { Env } from "../types";

export const memberJoinedChannel: EventLazyHandler<
  "member_joined_channel",
  Env
> = async ({ context, payload, env }) => {
  await context.client.chat.postMessage({
    channel: env.SLACK_CHANNEL,
    text: `Hi <@${payload.user}>, nice to meet you! :wave:`,
  });
};
