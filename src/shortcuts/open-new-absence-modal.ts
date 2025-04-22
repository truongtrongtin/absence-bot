import { newAbsenceModal } from "@/blocks/new-absence-modal";
import { Env } from "@/types";
import { GlobalShortcutLazyHandler } from "slack-edge";

export const openNewAbsenceModal: GlobalShortcutLazyHandler<Env> = async ({
  context,
  payload,
}) => {
  await context.client.views.open({
    trigger_id: payload.trigger_id,
    view: newAbsenceModal(),
  });
};
