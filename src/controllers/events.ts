import { getEvents } from "@/services/get-events";
import type { CFArgs, User } from "@/types";
import type { IRequest, RequestHandler } from "itty-router";

export const events: RequestHandler<{ user: User } & IRequest, CFArgs> = async (
  request,
  env,
) => {
  const query = new URLSearchParams(request.query as Record<string, string>);
  query.set("q", request.user.Admin ? "off" : `${request.user.Name} (off`);
  return getEvents({ query, env });
};
