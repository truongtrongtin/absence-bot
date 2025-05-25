import {
  addDays,
  formatDate,
  generateTimeText,
  getToday,
  isWeekendInRange,
} from "@/helpers";
import { AbsencePayload, DayPart, Env } from "@/types";
import * as chrono from "chrono-node/en";
import { EventLazyHandler } from "slack-edge";

export const listenAndSuggestNewAbsence: EventLazyHandler<
  "message",
  Env
> = async ({ context, payload, env }) => {
  let message: any;
  switch (payload.subtype) {
    case "file_share":
    case undefined: {
      message = payload;
      break;
    }
    case "message_changed": {
      message = payload.message;
      const previousMessage: any = payload.previous_message;
      // ignore when delete a message of a thread, which also triggers a message_changed event
      if (message.text === previousMessage.text) return;
      break;
    }
    default:
      return;
  }

  const regexp = /(^|\s)(off|nghỉ)([?!.,]|$|\s(?!sớm))/gi;
  if (!regexp.test(message.text)) return;

  const translationResponse = await fetch(
    `https://translation.googleapis.com/language/translate/v2`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": env.GOOGLE_API_KEY,
      },
      body: JSON.stringify({
        source: "vi",
        target: "en",
        q: message.text
          ?.replaceAll(/t2|thứ 2/gi, "monday")
          ?.replaceAll(/t3|thứ 3/gi, "tuesday")
          ?.replaceAll(/t4|thứ 4/gi, "wednesdays")
          ?.replaceAll(/t5|thứ 5/gi, "thursday")
          ?.replaceAll(/t6|thứ 6/gi, "friday")
          ?.replaceAll(/nghỉ/gi, "off")
          ?.replaceAll(/\//g, " tháng ")
          ?.replaceAll(/-/g, " đến "),
        format: "text",
      }),
    },
  );
  const translationObject: any = await translationResponse.json();
  const translatedText = translationObject.data.translations[0].translatedText;
  console.log("translatedText", translatedText);

  const quote = message.text
    .split("\n")
    .map((text: string) => `>${text}`)
    .join("\n");

  const ranges = chrono.parse(translatedText);

  const today = getToday();
  const map = new Map();
  for (const range of ranges) {
    const startDate = range.start.date();
    const endDate = range.end ? range.end.date() : startDate;

    // ignore duplicated range
    const hash =
      startDate.toDateString() +
      startDate.getHours() +
      endDate.toDateString() +
      endDate.getHours();
    if (map.has(hash)) return;
    map.set(hash, true);

    if (!startDate) return;
    if (new Date(new Date(startDate).setHours(15, 0, 0, 0)) < today) {
      return;
    }
    if (endDate < startDate) return;
    if (isWeekendInRange(startDate, endDate)) {
      // const failureText = `${quote}\nNot allow weekend!`;
      // await context.say({
      //   thread_ts: message.ts,
      //   blocks: [
      //     {
      //       type: "section",
      //       text: {
      //         type: "mrkdwn",
      //         text: failureText,
      //         verbatim: true,
      //       },
      //     },
      //   ],
      //   text: failureText,
      // });
      return;
    }
    if (startDate > addDays(today, 365)) {
      // const failureText = "No more than 1 year from now!";
      // await context.say({
      //   thread_ts: message.ts,
      //   blocks: [
      //     {
      //       type: "section",
      //       text: {
      //         type: "mrkdwn",
      //         text: `${quote}\n${failureText}`,
      //         verbatim: true,
      //       },
      //     },
      //   ],
      //   text: failureText,
      // });
      return;
    }

    let dayPart = DayPart.FULL;
    if (
      startDate.getTime() ===
      new Date(new Date(startDate).setHours(6, 0, 0, 0)).getTime()
    ) {
      dayPart = DayPart.MORNING;
    }
    if (
      startDate.getTime() ===
      new Date(new Date(startDate).setHours(15, 0, 0, 0)).getTime()
    ) {
      dayPart = DayPart.AFTERNOON;
    }

    const startDateString = formatDate(startDate);
    const endDateString = formatDate(endDate);
    const isSingleMode = startDateString === endDateString;
    if (!isSingleMode && dayPart !== DayPart.FULL) return;

    const timeText = generateTimeText({ startDate, endDate, dayPart });
    const text = `<@${message.user}>, are you going to be absent *${timeText}*?`;
    const absencePayload: AbsencePayload = {
      targetUserId: message.user,
      startDateString,
      endDateString,
      dayPart,
      reason: message.text,
    };

    await context.say({
      thread_ts: message.ts,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `${quote}\n${text}`,
            verbatim: true,
          },
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              action_id: "create_absence_from_suggestion",
              text: {
                type: "plain_text",
                emoji: true,
                text: "Yes",
              },
              style: "primary",
              value: JSON.stringify(absencePayload),
              confirm: {
                title: {
                  type: "plain_text",
                  text: "Absence confirm",
                  emoji: true,
                },
                text: {
                  type: "plain_text",
                  text: `Do you confirm to be absent ${timeText}?\n The submission will take some time, please be patient.`,
                },
                confirm: {
                  type: "plain_text",
                  text: "Confirm",
                  emoji: true,
                },
              },
            },
            {
              type: "button",
              action_id: "open_new_absence_modal",
              text: {
                type: "plain_text",
                emoji: true,
                text: "No, submit myself",
              },
              value: JSON.stringify(absencePayload),
            },
          ],
        },
      ],
      text,
    });
  }
};
