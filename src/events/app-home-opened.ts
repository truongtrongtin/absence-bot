import { appHome } from "@/blocks/app-home";
import type { Env } from "@/types";
import type { EventLazyHandler } from "slack-edge";

export const appHomeOpened: EventLazyHandler<"app_home_opened", Env> = async ({
  context,
  payload,
}) => {
  await context.client.views.publish({
    user_id: payload.user,
    view: appHome(),
  });
};
