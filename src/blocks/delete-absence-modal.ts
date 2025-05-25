import { CalendarEvent } from "@/types";
import { ModalView } from "slack-edge";

export type DeleteAbsencePayload = {
  eventId: CalendarEvent["id"];
  message_ts: string;
  timeText: string;
};

export function deleteAbsenceModal(
  deleteAbsencePayload: DeleteAbsencePayload,
): ModalView {
  const { timeText } = deleteAbsencePayload;
  return {
    type: "modal",
    callback_id: "delete_absence_submit",
    private_metadata: JSON.stringify(deleteAbsencePayload),
    title: {
      type: "plain_text",
      text: "Delete absence confirm",
    },
    submit: {
      type: "plain_text",
      text: "Yes",
      emoji: true,
    },
    close: {
      type: "plain_text",
      text: "No",
      emoji: true,
    },
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${timeText}*\nAre you sure you want to delete this absence?\nThis cannot be undone.`,
        },
      },
    ],
  };
}
