import { appHome } from "@/blocks/app-home";
import { Env } from "@/types";
import { BlockActionLazyHandler } from "slack-edge";

export const backToHome: BlockActionLazyHandler<"button", Env> = async ({
  context,
  payload,
}) => {
  await context.client.views.publish({
    user_id: payload.user.id,
    view: appHome(),
  });
};
