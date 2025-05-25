import { DayPart } from "@/types";
import { PlainTextOption } from "slack-edge";

export const dayPartOptions: PlainTextOption[] = [
  {
    text: {
      type: "plain_text",
      text: ":beach_with_umbrella: Full",
      emoji: true,
    },
    value: DayPart.FULL,
  },
  {
    text: {
      type: "plain_text",
      text: `:sunny: Morning`,
      emoji: true,
    },
    value: DayPart.MORNING,
  },
  {
    text: {
      type: "plain_text",
      text: ":city_sunset: Afternoon",
      emoji: true,
    },
    value: DayPart.AFTERNOON,
  },
];
