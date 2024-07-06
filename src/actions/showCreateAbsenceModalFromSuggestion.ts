import { createAbsenceView } from "@/blocks/createAbsenceView";
import { Env } from "@/types";
import { BlockActionLazyHandler } from "slack-edge";

export const showCreateAbsenceModalFromSuggestion: BlockActionLazyHandler<
  "button",
  Env
> = async ({ context, payload }) => {
  await context.client.views.open({
    trigger_id: payload.trigger_id,
    view: createAbsenceView(),
  });
};
