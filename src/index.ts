import { AutoRouter, IRequest, cors } from "itty-router";
import { SlackApp } from "slack-edge";
import { backToHome } from "./actions/backToHome.js";
import { createAbsenceFromSuggestion } from "./actions/createAbsenceFromSuggestion.js";
import { deleteAbsenceFromAppHome } from "./actions/deleteAbsenceFromAppHome.js";
import {
  showAbsenceList,
  showAbsenceListLoader,
} from "./actions/showAbsenceList.js";
import { showCreateAbsenceModalFromSuggestion } from "./actions/showCreateAbsenceModalFromSuggestion.js";
import { getEvents } from "./controllers/getEvents.js";
import { getUsers } from "./controllers/getUsers.js";
import { appHomeOpened } from "./events/appHomeOpened.js";
import { memberJoinedChannel } from "./events/memberJoinedChannel.js";
import { postSuggestionFromMessage } from "./messages/postSuggestionFromMessage.js";
import { checkAccessToken } from "./middlewares/checkAccessToken.js";
import { reportTodayAbsences } from "./services/reportTodayAbsences.js";
import { showCreateAbsenceModalFromGlobalShortcut } from "./shortcuts/showCreateAbsenceModalFromGlobalShortcut.js";
import { showDeleteMessageModalFromMessageShortcut } from "./shortcuts/showDeleteMessageModalFromMessageShortcut.js";
import { showPostSuggestionModalFromMessageShortcut } from "./shortcuts/showPostSuggestionModalFromMessageShortcut.js";
import { CFArgs } from "./types.js";
import {
  createAbsenceFromModal,
  createAbsenceFromModalAckHandler,
} from "./views/createAbsenceFromModal.js";
import { deleteMessageFromModal } from "./views/deleteMessageFromModal.js";
import {
  postSuggestionFromModal,
  postSuggestionFromModalAckHandler,
} from "./views/postSuggestionFromModal.js";

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
      createAbsenceFromSuggestion,
    )
    .action("view-all-absences", showAbsenceListLoader, showAbsenceList)
    .action("back-to-home", noopAckHandler, backToHome)
    .globalShortcut(
      "global_new_absence",
      noopAckHandler,
      showCreateAbsenceModalFromGlobalShortcut,
    )
    .messageShortcut(
      "message_delete",
      noopAckHandler,
      showDeleteMessageModalFromMessageShortcut,
    )
    .messageShortcut(
      "message_new_suggestion",
      noopAckHandler,
      showPostSuggestionModalFromMessageShortcut,
    )
    .anyMessage(postSuggestionFromMessage)
    .event("app_home_opened", appHomeOpened)
    .event("member_joined_channel", memberJoinedChannel)
    .viewSubmission(
      "new-suggestion-submit",
      postSuggestionFromModalAckHandler,
      postSuggestionFromModal,
    )
    .viewSubmission(
      "new-absence-submit",
      createAbsenceFromModalAckHandler,
      createAbsenceFromModal,
    )
    .viewSubmission(
      "delete-message-submit",
      async () => ({ response_action: "clear" }),
      deleteMessageFromModal,
    );
  return app.run(request, context);
});

export default {
  fetch: router.fetch,
  scheduled: reportTodayAbsences,
};
