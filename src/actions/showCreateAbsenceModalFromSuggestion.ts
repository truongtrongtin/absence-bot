import { BlockActionLazyHandler } from "slack-edge";
import { createAbsenceView } from "../blocks/createAbsenceView.js";
import { Env } from "../types.js";

export const showCreateAbsenceModalFromSuggestion: BlockActionLazyHandler<
  "button",
  Env
> = async ({ context, payload }) => {
  await context.client.views.open({
    trigger_id: payload.trigger_id,
    view: createAbsenceView(),
  });
};
