import { backToHome } from "@/actions/back-to-home";
import { createAbsenceFromSuggestion } from "@/actions/create-absence-from-suggestion";
import { openAbsenceList } from "@/actions/open-absence-list";
import { openDeleteAbsenceModal } from "@/actions/open-delete-absence-modal";
import { openLeaveBalanceModal } from "@/actions/open-leave-balance-modal";
import { openNewAbsenceModalFromButton } from "@/actions/open-new-absence-modal-from-button";
import { selectYear } from "@/actions/select-year";
import { events } from "@/controllers/events";
import { getQuotes } from "@/controllers/get-quotes";
import { users } from "@/controllers/users";
import { appHomeOpened } from "@/events/app-home-opened";
import { listenAndSuggestNewAbsence } from "@/messages/listen-and-suggest-new-absence";
import { withUser } from "@/middlewares/with-user";
import { reportTodayAbsences } from "@/services/report-today-absences";
import { openBotMessageDeletionModal } from "@/shortcuts/open-bot-message-deletion-modal";
import { openNewAbsenceModal } from "@/shortcuts/open-new-absence-modal";
import { openNewSuggestionModal } from "@/shortcuts/open-new-suggestion-modal";
import type { CFArgs } from "@/types";
import { deleteAbsence } from "@/views/delete-absence";
import { deleteBotMessage } from "@/views/delete-bot-message";
import {
  submitNewAbsence,
  submitNewAbsenceAck,
} from "@/views/submit-new-absence";
import {
  submitNewSuggestion,
  submitNewSuggestionAck,
} from "@/views/submit-new-suggestion";
import { AutoRouter, type IRequest, cors } from "itty-router";
import { SlackApp } from "slack-edge";

const { preflight, corsify } = cors();
const router = AutoRouter<IRequest, CFArgs, Response>({
  before: [preflight],
  finally: [corsify],
});

router.get("/events", withUser, events);
router.get("/users", withUser, users);
router.get("/quotes", withUser, getQuotes);
// router.get("/migrate", migrateEventName);
router.get("/report", reportTodayAbsences);
router.post("/slack/events", (request, env, context) => {
  async function noopAckHandler() {}
  const app = new SlackApp({ env })
    .use(async ({ body }) => {
      console.info("body", body);
    })
    .action(
      "open_new_absence_modal",
      noopAckHandler,
      openNewAbsenceModalFromButton,
    )
    .action("show_delete_absence_modal", noopAckHandler, openDeleteAbsenceModal)
    .action(
      "create_absence_from_suggestion",
      noopAckHandler,
      createAbsenceFromSuggestion,
    )
    .action("open_absence_list", noopAckHandler, openAbsenceList)
    .action("open_leave_balance_modal", noopAckHandler, openLeaveBalanceModal)
    .action("select_year", noopAckHandler, selectYear)
    .action("back_to_home", noopAckHandler, backToHome)
    .globalShortcut("global_new_absence", noopAckHandler, openNewAbsenceModal)
    .messageShortcut(
      "message_delete",
      noopAckHandler,
      openBotMessageDeletionModal,
    )
    .messageShortcut(
      "message_new_suggestion",
      noopAckHandler,
      openNewSuggestionModal,
    )
    .anyMessage(listenAndSuggestNewAbsence)
    .event("app_home_opened", appHomeOpened)
    .viewSubmission(
      "new_suggestion_submit",
      submitNewSuggestionAck,
      submitNewSuggestion,
    )
    .viewSubmission("new_absence_submit", submitNewAbsenceAck, submitNewAbsence)
    .viewSubmission("delete_absence_submit", noopAckHandler, deleteAbsence)
    .viewSubmission(
      "delete_message_submit",
      async () => ({ response_action: "clear" }),
      deleteBotMessage,
    );
  return app.run(request, context);
});

export default {
  fetch: router.fetch,
  scheduled: reportTodayAbsences,
} satisfies ExportedHandler<CFArgs[0]>;
