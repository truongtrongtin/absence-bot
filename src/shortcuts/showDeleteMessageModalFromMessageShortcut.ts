import { MessageShortcutLazyHandler } from "slack-edge";
import { findMemberById } from "../helpers";
import { deleteMessageView } from "../user-interface/deleteMessageView";

export const showDeleteMessageModalFromMessageShortcut: MessageShortcutLazyHandler =
  async ({ context, payload }) => {
    const messageText = payload.message.text;
    if (!messageText) return;
    const messageTs = payload.message.ts;
    await context.client.views.open({
      trigger_id: payload.trigger_id,
      view: deleteMessageView(messageText, messageTs),
    });

    const foundMember = findMemberById(payload.user.id);
    if (!foundMember) throw Error("member not found");
    console.log(
      `${foundMember.name} is opening delete message modal from message shortcut`
    );
  };
