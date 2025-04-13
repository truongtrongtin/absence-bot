import { CFArgs } from "@/types";
import { IRequest, RequestHandler } from "itty-router";

export const getQuotes: RequestHandler<IRequest, CFArgs> = async (
  request,
  env,
) => {
  const response = await fetch("https://api.api-ninjas.com/v1/quotes", {
    headers: { "X-Api-Key": env.API_NINJAS_API_KEY },
  });
  if (!response.ok) throw response;
  return response.json();
};
