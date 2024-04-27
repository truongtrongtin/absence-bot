import { BlockAction, BlockActionLazyHandler, ButtonAction } from "slack-edge";
import { Env } from "..";
import { AbsencePayload } from "../types";
import { createAbsenceView } from "../user-interface/createAbsenceView";

export const showCreateAbsenceModalFromSuggestion: BlockActionLazyHandler<
  "button",
  Env
> = async ({ context, payload, body }) => {
  const absencePayload: AbsencePayload | undefined = body.value
    ? JSON.parse(body.value)
    : undefined;
  await context.client.views.open({
    trigger_id: payload.trigger_id,
    view: createAbsenceView(payload.user.id, absencePayload),
  });
};
