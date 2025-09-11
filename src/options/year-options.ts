import { getYearInTimezone } from "@/helpers";
import { PlainTextOption } from "slack-edge";

export function getYearOptions(): PlainTextOption[] {
  const currentYear = getYearInTimezone(new Date());
  const startYear = 2019;
  const years: PlainTextOption[] = [];

  for (let year = currentYear + 1; year >= startYear; year--) {
    years.push({
      text: {
        type: "plain_text",
        text: year.toString(),
        emoji: true,
      },
      value: year.toString(),
    });
  }

  return years;
}
