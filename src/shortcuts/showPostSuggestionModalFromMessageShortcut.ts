import { MessageShortcutLazyHandler } from "slack-edge";
import { createSuggestionView } from "../blocks/createSuggestionView";

export const showPostSuggestionModalFromMessageShortcut: MessageShortcutLazyHandler =
  async ({ context, payload }) => {
    const targetUserId = payload.user.id;

    await context.client.views.open({
      trigger_id: payload.trigger_id,
      view: createSuggestionView(
        targetUserId,
        payload.message.text || "",
        payload.message_ts
      ),
    });
  };
