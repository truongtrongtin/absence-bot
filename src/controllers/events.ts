import { getEvents } from "@/services/getEvents";
import { CFArgs, User } from "@/types";
import { IRequest, RequestHandler } from "itty-router";

export const events: RequestHandler<{ user: User } & IRequest, CFArgs> = async (
  request,
  env,
  context
) => {
  const query = new URLSearchParams(request.query as Record<string, string>);
  query.set("q", request.user.Admin ? "off" : `${request.user.Name} (off`);
  return getEvents({ query, env });
};
