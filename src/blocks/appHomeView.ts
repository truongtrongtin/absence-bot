import { HomeTabView } from "slack-edge";

export function appHomeView(): HomeTabView {
  return {
    type: "home",
    blocks: [
      {
        type: "actions",
        elements: [
          {
            type: "button",
            action_id: "absence-new",
            text: {
              type: "plain_text",
              text: "New Absence",
              emoji: true,
            },
            style: "primary",
          },
        ],
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            action_id: "view-all-absences",
            text: {
              type: "plain_text",
              text: "View My Absences",
              emoji: true,
            },
          },
        ],
      },
    ],
  };
}
