import { BlockActionLazyHandler } from "slack-edge";
import { Env } from "..";
import { AbsencePayload } from "../types";
import { createAbsenceView } from "../user-interface/createAbsenceView";

export const showCreateAbsenceModalFromSuggestion: BlockActionLazyHandler<
  "button",
  Env
> = async ({ context, payload }) => {
  const absencePayload: AbsencePayload | undefined = payload.actions[0].value
    ? JSON.parse(payload.actions[0].value)
    : undefined;
  await context.client.views.open({
    trigger_id: payload.trigger_id,
    view: createAbsenceView(absencePayload),
  });
};
