import { EventLazyHandler } from "slack-edge";
import { appHomeView } from "../blocks/appHomeView";
import { Env } from "../types";

export const appHomeOpened: EventLazyHandler<"app_home_opened", Env> = async ({
  context,
  payload,
}) => {
  await context.client.views.publish({
    user_id: payload.user,
    view: appHomeView(),
  });
};
