import { MessageShortcutLazyHandler } from "slack-edge";

export const openBotMessageDeletionModal: MessageShortcutLazyHandler = async ({
  context,
  payload,
}) => {
  const messageText = payload.message.text;
  if (!messageText) return;
  const messageTs = payload.message.ts;
  const quote = messageText
    .split("\n")
    .map((text: string) => `>${text}`)
    .join("\n");

  await context.client.views.open({
    trigger_id: payload.trigger_id,
    view: {
      type: "modal",
      callback_id: "delete_message_submit",
      // notify_on_close: true,
      private_metadata: JSON.stringify({ messageTs }),
      title: {
        type: "plain_text",
        text: "Delete confirm",
      },
      submit: {
        type: "plain_text",
        text: "Delete",
        emoji: true,
      },
      close: {
        type: "plain_text",
        text: "Cancel",
        emoji: true,
      },
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `${quote}\nAre you sure to delete this message?`,
          },
        },
      ],
    },
  });
};
