import type { ModalView } from "slack-edge";

export function leaveBalanceModal({ value }: { value?: number }): ModalView {
  return {
    type: "modal",
    title: {
      type: "plain_text",
      text: "Leave balance",
      emoji: true,
    },
    blocks: value
      ? [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: value.toString(),
            },
          },
        ]
      : [
          {
            type: "section",
            text: {
              type: "plain_text",
              text: "Loading...",
              emoji: true,
            },
          },
        ],
  };
}
