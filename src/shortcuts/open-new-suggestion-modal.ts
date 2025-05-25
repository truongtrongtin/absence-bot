import { newSuggestionModal } from "@/blocks/new-suggestion-modal";
import { MessageShortcutLazyHandler } from "slack-edge";

export const openNewSuggestionModal: MessageShortcutLazyHandler = async ({
  context,
  payload,
}) => {
  const targetUserId = payload.message.user;
  if (!targetUserId) return;

  await context.client.views.open({
    trigger_id: payload.trigger_id,
    view: newSuggestionModal({
      targetUserId,
      reason: payload.message.text || "",
      messageTs: payload.message_ts,
    }),
  });
};
