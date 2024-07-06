import { CFArgs } from "@/types";
import { IRequest, RequestHandler, error } from "itty-router";

type UserInfo = {
  name: string;
};

export const checkAccessToken: RequestHandler<IRequest, CFArgs> = async (
  controller,
  env,
  context
) => {
  const clientAccessToken = controller.query.access_token;
  if (!clientAccessToken) {
    return error(400, "Required parameter is missing");
  }
  const response = await fetch(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    { headers: { Authorization: `Bearer ${clientAccessToken}` } }
  );
  const userInfo = <UserInfo>await response.json();
  if (!response.ok) return error(response.status, userInfo);
};
