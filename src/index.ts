import { SlackApp, SlackAppLogLevel } from "slack-edge";
import { createAbsenceFromSuggestion } from "./actions/createAbsenceFromSuggestion";
import { deleteAbsenceFromAppHome } from "./actions/deleteAbsenceFromAppHome";
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
/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `wrangler dev src/index.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `wrangler deploy src/index.ts --name my-worker` to deploy your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env {
  // Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
  // MY_KV_NAMESPACE: KVNamespace;
  //
  // Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
  // MY_DURABLE_OBJECT: DurableObjectNamespace;
  //
  // Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
  // MY_BUCKET: R2Bucket;
  //
  // Example binding to a Service. Learn more at https://developers.cloudflare.com/workers/runtime-apis/service-bindings/
  // MY_SERVICE: Fetcher;
  SLACK_SIGNING_SECRET: string;
  SLACK_BOT_TOKEN: string;
  SLACK_LOGGING_LEVEL: SlackAppLogLevel;
  SLACK_CHANNEL: string;
  GOOGLE_CALENDAR_ID: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_REFRESH_TOKEN: string;
  GOOGLE_API_KEY: string;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const app = new SlackApp({ env })
      // When the pattern matches, the framework automatically acknowledges the request
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