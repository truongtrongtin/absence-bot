import { Env } from "@/types";

type TokenObject = {
  access_token: string;
};

export async function getAccessToken({ env }: { env: Env }) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: JSON.stringify({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: env.GOOGLE_REFRESH_TOKEN,
    }),
  });
  const tokenObject = <TokenObject>await response.json();
  if (!response.ok) throw tokenObject;
  return tokenObject.access_token;
}
