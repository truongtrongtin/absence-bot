import { createSuggestionView } from "@/blocks/createSuggestionView";
import { MessageShortcutLazyHandler } from "slack-edge";

export const showPostSuggestionModalFromMessageShortcut: MessageShortcutLazyHandler =
  async ({ context, payload }) => {
    const targetUserId = payload.message.user;
    if (!targetUserId) return;

    await context.client.views.open({
      trigger_id: payload.trigger_id,
      view: createSuggestionView(
        targetUserId,
        payload.message.text || "",
        payload.message_ts,
      ),
    });
  };
