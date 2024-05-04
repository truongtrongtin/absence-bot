import { SlackApp, SlackAppLogLevel } from "slack-edge";
import { backToHome } from "./actions/backToHome";
import { createAbsenceFromSuggestion } from "./actions/createAbsenceFromSuggestion";
import { deleteAbsenceFromAppHome } from "./actions/deleteAbsenceFromAppHome";
import {
  showAbsenceList,
  showAbsenceListAckHandler,
} from "./actions/showAbsenceList";
import { showCreateAbsenceModalFromSuggestion } from "./actions/showCreateAbsenceModalFromSuggestion";
import { appHomeOpened } from "./events/appHomeOpened";
import { memberJoinedChannel } from "./events/memberJoinedChannel";
import { postSuggestionFromMessage } from "./messages/postSuggestionFromMessage";
import { showCreateAbsenceModalFromGlobalShortcut } from "./shortcuts/showCreateAbsenceModalFromGlobalShortcut";
import { showDeleteMessageModalFromMessageShortcut } from "./shortcuts/showDeleteMessageModalFromMessageShortcut";
import { showPostSuggestionModalFromMessageShortcut } from "./shortcuts/showPostSuggestionModalFromMessageShortcut";
import {
  createAbsenceFromModal,
  createAbsenceFromModalAckHandler,
} from "./views/createAbsenceFromModal";
import { deleteMessageFromModal } from "./views/deleteMessageFromModal";
import {
  postSuggestionFromModal,
  postSuggestionFromModalAckHandler,
} from "./views/postSuggestionFromModal";

export interface Env {
  SLACK_SIGNING_SECRET: string;
  SLACK_BOT_TOKEN: string;
  SLACK_LOGGING_LEVEL: SlackAppLogLevel;
  SLACK_CHANNEL: string;
  GOOGLE_CALENDAR_ID: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_REFRESH_TOKEN: string;
  GOOGLE_API_KEY: string;
  MEMBER_LIST_JSON: string;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const app = new SlackApp({ env })
      .action(
        "absence-new",
        noopAckHandler,
        showCreateAbsenceModalFromSuggestion
      )
      .action(
        "app-home-absence-delete",
        noopAckHandler,
        deleteAbsenceFromAppHome
      )
      .action(
        "absence-suggestion-yes",
        noopAckHandler,
        createAbsenceFromSuggestion
      )
      .action("view-all-absences", showAbsenceListAckHandler, showAbsenceList)
      .action("back-to-home", noopAckHandler, backToHome)
      .globalShortcut(
        "global_new_absence",
        noopAckHandler,
        showCreateAbsenceModalFromGlobalShortcut
      )
      .messageShortcut(
        "message_delete",
        noopAckHandler,
        showDeleteMessageModalFromMessageShortcut
      )
      .messageShortcut(
        "message_new_suggestion",
        noopAckHandler,
        showPostSuggestionModalFromMessageShortcut
      )
      .anyMessage(postSuggestionFromMessage)
      .event("app_home_opened", appHomeOpened)
      .event("member_joined_channel", memberJoinedChannel)
      .viewSubmission(
        "new-suggestion-submit",
        postSuggestionFromModalAckHandler,
        postSuggestionFromModal
      )
      .viewSubmission(
        "new-absence-submit",
        createAbsenceFromModalAckHandler,
        createAbsenceFromModal
      )
      .viewSubmission(
        "delete-message-submit",
        async () => ({ response_action: "clear" }),
        deleteMessageFromModal
      );
    return await app.run(request, ctx);
  },
};

async function noopAckHandler() {}
