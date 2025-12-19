import { absenceList } from "@/blocks/absence-list";
import {
  findUserByEmail,
  getEndOfYearInTimezone,
  getStartOfYearInTimezone,
  getYearInTimezone,
} from "@/helpers";
import { getEvents } from "@/services/get-events";
import { getUsers } from "@/services/get-users";
import type { CalendarEvent, Env } from "@/types";
import type {
  BlockActionLazyHandler,
  ButtonAction,
  ViewBlockAction,
} from "slack-edge";

export const openAbsenceList: BlockActionLazyHandler<
  "button",
  Env,
  ViewBlockAction<ButtonAction>
> = async ({ context, payload, env }) => {
  await context.client.views.publish({
    user_id: payload.user.id,
    view: {
      type: "home",
      blocks: [
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

  const [users, { user: slackUser }] = await Promise.all([
    getUsers({ env }),
    context.client.users.info({ user: payload.user.id }),
  ]);
  const targetUser = findUserByEmail({
    users,
    email: slackUser?.profile?.email || "",
  });

  let absenceEvents: CalendarEvent[] = [];
  if (targetUser) {
    const searchString = `${targetUser["Name"]} (off`;
    const query = new URLSearchParams({
      timeMin: getStartOfYearInTimezone(new Date()).toISOString(),
      timeMax: getEndOfYearInTimezone(new Date()).toISOString(),
      q: searchString,
      orderBy: "startTime",
      singleEvents: "true",
    });
    const events = await getEvents({ env, query });
    // filter again because q params is a full-text search, not reliable for exact summary matching
    absenceEvents = events.filter((event) =>
      event.summary.startsWith(searchString),
    );
  }
  await context.client.views.publish({
    user_id: payload.user.id,
    view: absenceList({ absenceEvents, year: getYearInTimezone(new Date()) }),
  });
};
