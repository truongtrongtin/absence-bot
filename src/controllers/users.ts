import { CFArgs, User } from "@/types";
import { IRequest, RequestHandler } from "itty-router";

export const users: RequestHandler<
  { user: User; users: User[] } & IRequest,
  CFArgs
> = async (request, env, context) => {
  return request.user.Admin ? request.users : [request.user];
};
