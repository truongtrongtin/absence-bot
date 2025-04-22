import { appHome } from "@/blocks/app-home";
import { Env } from "@/types";
import { EventLazyHandler } from "slack-edge";

export const appHomeOpened: EventLazyHandler<"app_home_opened", Env> = async ({
  context,
  payload,
}) => {
  await context.client.views.publish({
    user_id: payload.user,
    view: appHome(),
  });
};
