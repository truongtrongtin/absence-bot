import { BlockActionLazyHandler } from "slack-edge";
import { Env } from "..";
import { appHomeView } from "../user-interface/appHomeView";

export const backToHome: BlockActionLazyHandler<"button", Env> = async ({
  context,
  payload,
}) => {
  await context.client.views.publish({
    user_id: payload.user.id,
    view: appHomeView(),
  });
};
