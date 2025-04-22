import { HomeTabView } from "slack-edge";

export function appHome(): HomeTabView {
  return {
    type: "home",
    blocks: [
      {
        type: "actions",
        elements: [
          {
            type: "button",
            action_id: "open_new_absence_modal",
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
            action_id: "open_absence_list",
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
