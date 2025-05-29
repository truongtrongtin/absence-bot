import { DayPart } from "@/types";
import type { PlainTextOption } from "slack-edge";

export const dayPartOptions: PlainTextOption[] = [
  {
    text: {
      type: "plain_text",
      text: ":beach_with_umbrella: Full",
      emoji: true,
    },
    value: DayPart.full,
  },
  {
    text: {
      type: "plain_text",
      text: `:sunny: Morning`,
      emoji: true,
    },
    value: DayPart.morning,
  },
  {
    text: {
      type: "plain_text",
      text: ":city_sunset: Afternoon",
      emoji: true,
    },
    value: DayPart.afternoon,
  },
];
