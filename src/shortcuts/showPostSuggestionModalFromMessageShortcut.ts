import { MessageShortcutLazyHandler } from "slack-edge";
import { findMemberById } from "../helpers";
import { createSuggestionView } from "../user-interface/createSuggestionView";

export const showPostSuggestionModalFromMessageShortcut: MessageShortcutLazyHandler =
  async ({ context, payload }) => {
    const targetUserId = payload.message.user;
    if (!targetUserId) return;

    await context.client.views.open({
      trigger_id: payload.trigger_id,
      view: createSuggestionView(
        targetUserId,
        payload.message.text || "",
        payload.message_ts
      ),
    });

    const actionUser = findMemberById(payload.user.id);
    if (!actionUser) throw Error("member not found");
    console.log(
      `${actionUser.name} is opening new suggestion modal from message shortcut`
    );
  };
