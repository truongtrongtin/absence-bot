import {
  addDays,
  formatDateInTimezone,
  generateTimeText,
  get3pmInTimezone,
  getStartOfDayInTimezone,
  isWeekendInRange,
} from "@/helpers";
import type { AbsencePayload, DayPart, Env } from "@/types";
import * as chrono from "chrono-node/en";
import type {
  EventLazyHandler,
  FileShareMessageEvent,
  GenericMessageEvent,
} from "slack-edge";

export const isRightMessageEvent = (event: {
  type: string;
  subtype?: string;
}): event is GenericMessageEvent | FileShareMessageEvent => {
  return event.subtype === undefined || event.subtype === "file_share";
};

export const listenAndSuggestNewAbsence: EventLazyHandler<
  "message",
  Env
> = async ({ context, payload, env }) => {
  let messagePayload: GenericMessageEvent | FileShareMessageEvent | undefined;
  if (isRightMessageEvent(payload)) {
    messagePayload = payload;
  }
  if (
    payload.subtype === "message_changed" &&
    isRightMessageEvent(payload.message) &&
    isRightMessageEvent(payload.previous_message) &&
    // handle the case deleting a message also triggers a message_changed event
    payload.message.text !== payload.previous_message.text
  ) {
    messagePayload = payload.message;
  }
  if (!messagePayload) return;

  const regexp = /(^|\s)(off|nghỉ)([?!.,]|$|\s(?!sớm))/gi;
  if (!regexp.test(messagePayload.text)) return;

  const translationResponse = await fetch(
    "https://translation.googleapis.com/language/translate/v2",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": env.GOOGLE_API_KEY,
      },
      body: JSON.stringify({
        source: "vi",
        target: "en",
        q: messagePayload.text
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
  console.info("translatedText", translatedText);

  const quote = messagePayload.text
    .split("\n")
    .map((text: string) => `>${text}`)
    .join("\n");

  const now = new Date();
  const ranges = chrono.parse(translatedText, getStartOfDayInTimezone(now));

  const map = new Map();
  for (const range of ranges) {
    const startDate = range.start.date();
    const endDate = range.end ? range.end.date() : startDate;

    // ignore duplicated range
    const hash = startDate.getTime() + endDate.getTime();
    if (map.has(hash)) return;
    map.set(hash, true);

    if (!startDate) return;
    if (now > get3pmInTimezone(new Date(startDate))) {
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
    if (startDate > addDays(now, 365)) {
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

    let dayPart: DayPart = "full";
    if (
      startDate.getTime() ===
      new Date(new Date(startDate).setHours(6, 0, 0, 0)).getTime()
    ) {
      dayPart = "morning";
    }
    if (
      startDate.getTime() ===
      new Date(new Date(startDate).setHours(15, 0, 0, 0)).getTime()
    ) {
      dayPart = "afternoon";
    }

    const startDateString = formatDateInTimezone(startDate);
    const endDateString = formatDateInTimezone(endDate);
    const isSingleMode = startDateString === endDateString;
    if (!isSingleMode && dayPart !== "full") return;

    const timeText = generateTimeText({ startDate, endDate, dayPart });
    const text = `<@${messagePayload.user}>, are you going to be absent *${timeText}*?`;
    const absencePayload: AbsencePayload = {
      targetUserId: messagePayload.user,
      startDateString,
      endDateString,
      dayPart,
      reason: messagePayload.text,
    };

    await context.say({
      thread_ts: messagePayload.ts,
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
