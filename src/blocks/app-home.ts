import type { HomeTabView } from "slack-edge";

export function appHome(): HomeTabView {
  return {
    type: "home",
    blocks: [
      {
        type: "actions",
        block_id: "home_actions",
        elements: [
          {
            type: "button",
            action_id: "open_new_absence_modal",
            text: {
              type: "plain_text",
              text: "New absence",
              emoji: true,
            },
            style: "primary",
          },
          {
            type: "button",
            action_id: "open_absence_list",
            text: {
              type: "plain_text",
              text: "My absences",
              emoji: true,
            },
          },
          {
            type: "button",
            action_id: "open_leave_balance_modal",
            text: {
              type: "plain_text",
              text: "My leave balance",
              emoji: true,
            },
          },
        ],
      },
    ],
  };
}
