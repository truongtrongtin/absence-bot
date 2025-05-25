import { absenceList } from "@/blocks/absence-list";
import type { DeleteAbsencePayload } from "@/blocks/delete-absence-modal";
import { findUserByEmail, getToday, startOfDay } from "@/helpers";
import { getAccessToken } from "@/services/get-acess-token";
import { getEvents } from "@/services/get-events";
import { getUsers } from "@/services/get-users";
import { Env } from "@/types";
import { ViewSubmissionLazyHandler } from "slack-edge";

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

  const { eventId, message_ts }: DeleteAbsencePayload = JSON.parse(
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

  // Get future absences from google calendar
  const query = new URLSearchParams({
    timeMin: startOfDay(getToday()).toISOString(),
    q: `${targetUser["Name"]} (off`,
    orderBy: "startTime",
    singleEvents: "true",
  });
  const absenceEvents = await getEvents({ env, query });

  await context.client.views.publish({
    user_id: payload.user.id,
    view: absenceList({ absenceEvents }),
  });
};
