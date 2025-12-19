import type { ModalView } from "slack-edge";

export function noPermissionModal(): ModalView {
  return {
    type: "modal",
    title: {
      type: "plain_text",
      text: "Unauthorized!",
    },
    close: {
      type: "plain_text",
      text: "Close",
    },
    blocks: [
      {
        type: "section",
        text: {
          type: "plain_text",
          text: "You are not authorized to perform this action!",
        },
      },
    ],
  };
}
