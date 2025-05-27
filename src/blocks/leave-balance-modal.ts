import { CalendarEvent } from "@/types";
import { ModalView } from "slack-edge";

export type DeleteAbsencePayload = {
  eventId: CalendarEvent["id"];
  message_ts: string;
  timeText: string;
};

export function leaveBalanceModal({
  remainingDays,
}: {
  remainingDays: number;
}): ModalView {
  return {
    type: "modal",
    title: {
      type: "plain_text",
      text: "Leave balance",
      emoji: true,
    },
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: remainingDays.toString(),
        },
      },
    ],
  };
}
