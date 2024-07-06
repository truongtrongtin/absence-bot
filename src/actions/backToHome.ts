import { BlockActionLazyHandler } from "slack-edge";
import { appHomeView } from "../blocks/appHomeView.js";
import { Env } from "../types.js";

export const backToHome: BlockActionLazyHandler<"button", Env> = async ({
  context,
  payload,
}) => {
  await context.client.views.publish({
    user_id: payload.user.id,
    view: appHomeView(),
  });
};
