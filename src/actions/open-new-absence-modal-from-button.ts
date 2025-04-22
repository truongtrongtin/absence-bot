import { newAbsenceModal } from "@/blocks/new-absence-modal";
import { Env } from "@/types";
import { BlockActionLazyHandler } from "slack-edge";

export const openNewAbsenceModalFromButton: BlockActionLazyHandler<
  "button",
  Env
> = async ({ context, payload }) => {
  await context.client.views.open({
    trigger_id: payload.trigger_id,
    view: newAbsenceModal(),
  });
};
