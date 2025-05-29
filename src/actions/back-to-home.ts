import { appHome } from "@/blocks/app-home";
import type { Env } from "@/types";
import type {
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
