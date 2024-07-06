import { appHomeView } from "@/blocks/appHomeView";
import { Env } from "@/types";
import { BlockActionLazyHandler } from "slack-edge";

export const backToHome: BlockActionLazyHandler<"button", Env> = async ({
  context,
  payload,
}) => {
  await context.client.views.publish({
    user_id: payload.user.id,
    view: appHomeView(),
  });
};
