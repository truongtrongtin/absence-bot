import { appHome } from "@/blocks/app-home";
import { Env } from "@/types";
import {
  BlockActionLazyHandler,
  ButtonAction,
  ViewBlockAction,
} from "slack-edge";

export const backToHome: BlockActionLazyHandler<
  "button",
  Env,
  ViewBlockAction<ButtonAction>
> = async ({ context, payload }) => {
  await context.client.views.publish({
    user_id: payload.user.id,
    view: appHome(),
  });
};
