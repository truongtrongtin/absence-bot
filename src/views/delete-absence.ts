import { absenceList } from "@/blocks/absence-list";
import type { DeleteAbsencePayload } from "@/blocks/delete-absence-modal";
import { findUserByEmail } from "@/helpers";
import { getAccessToken } from "@/services/get-acess-token";
import { getEvents } from "@/services/get-events";
import { getUsers } from "@/services/get-users";
import type { Env } from "@/types";
import type { ViewSubmissionLazyHandler } from "slack-edge";

export const deleteAbsence: ViewSubmissionLazyHandler<Env> = async ({
  payload,
  context,
  env,
}) => {
  const [users, { user: slackUser }] = await Promise.all([
    getUsers({ env }),
    context.client.users.info({ user: payload.user.id }),
  ]);
  const targetUser = findUserByEmail({
    users,
    email: slackUser?.profile?.email || "",
  });
  if (!targetUser) return;

  const { eventId, message_ts, year }: DeleteAbsencePayload = JSON.parse(
    payload.view.private_metadata,
  );
  const accessToken = await getAccessToken({ env });

  // Delete absence event from google calendar
  await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${env.GOOGLE_CALENDAR_ID}/events/${eventId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  if (message_ts) {
    // Delete announced message
    await context.client.chat.delete({
      channel: env.SLACK_CHANNEL,
      ts: message_ts,
    });
  }

  const searchString = `${targetUser["Name"]} (off`;
  const query = new URLSearchParams({
    timeMin: new Date(year, 0, 1).toISOString(),
    timeMax: new Date(year + 1, 0, 1).toISOString(),
    q: searchString,
    orderBy: "startTime",
    singleEvents: "true",
  });
  const absenceEvents = await getEvents({ env, query });
  // filter again because q params is a full-text search, not reliable for exact summary matching
  const filteredAbsenceEvents = absenceEvents.filter((event) =>
    event.summary.startsWith(searchString),
  );

  await context.client.views.publish({
    user_id: payload.user.id,
    view: absenceList({ absenceEvents: filteredAbsenceEvents, year }),
  });
};
