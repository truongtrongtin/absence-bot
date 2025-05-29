import type { DeleteAbsencePayload } from "@/blocks/delete-absence-modal";
import { deleteAbsenceModal } from "@/blocks/delete-absence-modal";
import type { Env } from "@/types";
import type {
  BlockActionLazyHandler,
  OverflowAction,
  ViewBlockAction,
} from "slack-edge";

export const openDeleteAbsenceModal: BlockActionLazyHandler<
  "overflow",
  Env,
  ViewBlockAction<OverflowAction>
> = async ({ context, payload }) => {
  const deleteAbsencePayload: DeleteAbsencePayload = JSON.parse(
    payload.actions[0].selected_option.value,
  );
  await context.client.views.open({
    trigger_id: payload.trigger_id,
    view: deleteAbsenceModal(deleteAbsencePayload),
  });
};
