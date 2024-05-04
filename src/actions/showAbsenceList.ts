import { startOfToday, subDays } from "date-fns";
import {
  AnyHomeTabBlock,
  BlockActionAckHandler,
  BlockActionLazyHandler,
} from "slack-edge";
import { Env } from "..";
import {
  generateTimeText,
  getDayPartFromEventSummary,
  getMemberNameFromEventSummary,
} from "../helpers";
import { getAccessTokenFromRefreshToken } from "../services/getAccessTokenFromRefreshToken";
import { CalendarListResponse } from "../types";

export const showAbsenceListAckHandler: BlockActionAckHandler<
  "button"
> = async ({ context, payload }) => {
  await context.client.views.publish({
    user_id: payload.user.id,
    view: {
      type: "home",
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*All absences*",
          },
          accessory: {
            type: "button",
            action_id: "back-to-home",
            text: {
              type: "plain_text",
              text: "Back",
              emoji: true,
            },
          },
        },
        {
          type: "divider",
        },
        {
          type: "section",
          text: {
            type: "plain_text",
            text: "Loading...",
            emoji: true,
          },
        },
      ],
    },
  });
};

export const showAbsenceList: BlockActionLazyHandler<"button", Env> = async ({
  context,
  payload,
  env,
}) => {
  const accessToken = await getAccessTokenFromRefreshToken({ env });

  // Get future absences from google calendar
  const queryParams = new URLSearchParams({
    timeMin: startOfToday().toISOString(),
    q: "off",
    orderBy: "startTime",
    singleEvents: "true",
    maxResults: "2500",
  });
  const eventListResponse = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${env.GOOGLE_CALENDAR_ID}/events?${queryParams}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const eventListObject = <CalendarListResponse>await eventListResponse.json();
  const absenceEvents = eventListObject.items || [];

  const absenceBlocks: AnyHomeTabBlock[] = [];
  for (const event of absenceEvents) {
    const dayPart = getDayPartFromEventSummary(event.summary);
    const memberName = getMemberNameFromEventSummary(event.summary);
    const timeText = generateTimeText(
      new Date(event.start.date),
      subDays(new Date(event.end.date), 1),
      dayPart
    );
    absenceBlocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${memberName}*\n${timeText}`,
        verbatim: true,
      },
      accessory: {
        type: "button",
        action_id: "app-home-absence-delete",
        text: {
          type: "plain_text",
          text: "Delete",
          emoji: true,
        },
        style: "danger",
        value: JSON.stringify({
          eventId: event.id,
          email: event.attendees[0].email,
        }),
        confirm: {
          title: {
            type: "plain_text",
            text: "Delete absence",
            emoji: true,
          },
          text: {
            type: "mrkdwn",
            text: `Are you sure you want to delete this absence? This cannot be undone.`,
            verbatim: true,
          },
          confirm: {
            type: "plain_text",
            text: "Delete",
            emoji: true,
          },
          style: "danger",
        },
      },
    });
    absenceBlocks.push({
      type: "divider",
    });
  }
  if (absenceEvents.length === 0) {
    absenceBlocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: "Nothing to show",
      },
    });
  }

  await context.client.views.publish({
    user_id: payload.user.id,
    view: {
      type: "home",
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*All absences*",
          },
          accessory: {
            type: "button",
            action_id: "back-to-home",
            text: {
              type: "plain_text",
              text: "Back",
              emoji: true,
            },
          },
        },
        {
          type: "divider",
        },
        ...absenceBlocks,
      ],
    },
  });
};
