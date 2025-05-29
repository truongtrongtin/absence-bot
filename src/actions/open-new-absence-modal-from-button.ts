import { newAbsenceModal } from "@/blocks/new-absence-modal";
import type { Env } from "@/types";
import type {
  BlockActionLazyHandler,
  ButtonAction,
  MessageBlockAction,
  ViewBlockAction,
} from "slack-edge";

export const openNewAbsenceModalFromButton: BlockActionLazyHandler<
  "button",
  Env,
  MessageBlockAction<ButtonAction> | ViewBlockAction<ButtonAction>
> = async ({ context, payload }) => {
  await context.client.views.open({
    trigger_id: payload.trigger_id,
    view: newAbsenceModal(),
  });
};
