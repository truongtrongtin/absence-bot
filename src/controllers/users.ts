import type { CFArgs, User } from "@/types";
import type { IRequest, RequestHandler } from "itty-router";

export const users: RequestHandler<
  { user: User; users: User[] } & IRequest,
  CFArgs
> = async (request) => {
  return request.user.Admin ? request.users : [request.user];
};
