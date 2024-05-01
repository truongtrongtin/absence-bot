import { GlobalShortcutLazyHandler } from "slack-edge";
import { Env } from "..";
import { createAbsenceView } from "../user-interface/createAbsenceView";

export const showCreateAbsenceModalFromGlobalShortcut: GlobalShortcutLazyHandler<
  Env
> = async ({ context, payload }) => {
  await context.client.views.open({
    trigger_id: payload.trigger_id,
    view: createAbsenceView(),
  });
};
