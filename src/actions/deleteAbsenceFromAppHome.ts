import { showAbsenceList } from "@/actions/showAbsenceList";
import { getAccessTokenFromRefreshToken } from "@/services/getAccessTokenFromRefreshToken";
import { Env } from "@/types";
import { BlockActionLazyHandler } from "slack-edge";

export const deleteAbsenceFromAppHome: BlockActionLazyHandler<
  "button",
  Env
> = async (req) => {
  const { context, payload, env } = req;
  const { eventId, message_ts } = JSON.parse(payload.actions[0].value);
  const accessToken = await getAccessTokenFromRefreshToken({ env });

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

  await showAbsenceList(req);
};
