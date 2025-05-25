import type { DeleteAbsencePayload } from "@/blocks/delete-absence-modal";
import { deleteAbsenceModal } from "@/blocks/delete-absence-modal";
import { Env } from "@/types";
import {
  BlockActionLazyHandler,
  OverflowAction,
  ViewBlockAction,
} from "slack-edge";

export const showDeleteAbsenceModal: BlockActionLazyHandler<
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
