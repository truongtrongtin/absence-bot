import { findUserByEmail } from "@/helpers";
import { getUsers } from "@/services/get-users";
import type { CFArgs } from "@/types";
import { StatusError, type IRequest, type RequestHandler } from "itty-router";

type GoogleUser = {
  email: string;
  name: string;
};

export const withUser: RequestHandler<IRequest, CFArgs> = async (
  request,
  env,
) => {
  const clientAccessToken = request.query.access_token;
  if (!clientAccessToken) {
    throw new StatusError(400, "Required parameter is missing");
  }
  const response = await fetch(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    { headers: { Authorization: `Bearer ${clientAccessToken}` } },
  );
  const googleUser = <GoogleUser>await response.json();
  console.info(googleUser.name);
  if (!response.ok) throw new StatusError(response.status, googleUser);
  const users = await getUsers({ env });
  const user = findUserByEmail({ users, email: googleUser.email });
  if (!user) throw new StatusError(403);
  request.user = user;
  request.users = users;
};
