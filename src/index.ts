import { AutoRouter, IRequest, cors } from "itty-router";
import { SlackApp } from "slack-edge";
import { backToHome } from "./actions/backToHome";
import { createAbsenceFromSuggestion } from "./actions/createAbsenceFromSuggestion";
import { deleteAbsenceFromAppHome } from "./actions/deleteAbsenceFromAppHome";
import {
  showAbsenceList,
  showAbsenceListLoader,
} from "./actions/showAbsenceList";
import { showCreateAbsenceModalFromSuggestion } from "./actions/showCreateAbsenceModalFromSuggestion";
import { getEvents } from "./controllers/getEvents";
import { getUsers } from "./controllers/getUsers";
import { appHomeOpened } from "./events/appHomeOpened";
import { memberJoinedChannel } from "./events/memberJoinedChannel";
import { postSuggestionFromMessage } from "./messages/postSuggestionFromMessage";
import { checkAccessToken } from "./middlewares/checkAccessToken";
import { reportTodayAbsences } from "./services/reportTodayAbsences";
import { showCreateAbsenceModalFromGlobalShortcut } from "./shortcuts/showCreateAbsenceModalFromGlobalShortcut";
import { showDeleteMessageModalFromMessageShortcut } from "./shortcuts/showDeleteMessageModalFromMessageShortcut";
import { showPostSuggestionModalFromMessageShortcut } from "./shortcuts/showPostSuggestionModalFromMessageShortcut";
import { CFArgs } from "./types";
import {
  createAbsenceFromModal,
  createAbsenceFromModalAckHandler,
} from "./views/createAbsenceFromModal";
import { deleteMessageFromModal } from "./views/deleteMessageFromModal";
import {
  postSuggestionFromModal,
  postSuggestionFromModalAckHandler,
} from "./views/postSuggestionFromModal";

const { preflight, corsify } = cors();
const router = AutoRouter<IRequest, CFArgs>({
  before: [preflight],
  finally: [corsify],
});

router.get("/events", checkAccessToken, getEvents);
router.get("/users", checkAccessToken, getUsers);
router.post("/slack/events", (request, env, context) => {
  async function noopAckHandler() {}
  const app = new SlackApp({ env })
    .action("absence-new", noopAckHandler, showCreateAbsenceModalFromSuggestion)
    .action("app-home-absence-delete", noopAckHandler, deleteAbsenceFromAppHome)
    .action(
      "absence-suggestion-yes",
      noopAckHandler,
      createAbsenceFromSuggestion
    )
    .action("view-all-absences", showAbsenceListLoader, showAbsenceList)
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
  return app.run(request, context);
});

export default {
  fetch: router.fetch,
  scheduled: reportTodayAbsences,
};
