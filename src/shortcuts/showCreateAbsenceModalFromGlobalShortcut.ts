import { GlobalShortcutLazyHandler } from "slack-edge";
import { createAbsenceView } from "../blocks/createAbsenceView";
import { Env } from "../types";

export const showCreateAbsenceModalFromGlobalShortcut: GlobalShortcutLazyHandler<
  Env
> = async ({ context, payload }) => {
  await context.client.views.open({
    trigger_id: payload.trigger_id,
    view: createAbsenceView(),
  });
};
