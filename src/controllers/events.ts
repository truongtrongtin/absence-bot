import { getEvents } from "@/services/getEvents";
import { CFArgs } from "@/types";
import { IRequest, RequestHandler } from "itty-router";

export const events: RequestHandler<IRequest, CFArgs> = async (
  request,
  env,
  context
) => {
  const query = new URLSearchParams(request.query as Record<string, string>);
  return getEvents({ query, env });
};
