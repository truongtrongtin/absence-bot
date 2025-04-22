import { getToday } from "@/helpers";
import { getAccessToken } from "@/services/get-acess-token";
import { Env, User } from "@/types";

export const getUsers = async ({ env }: { env: Env }) => {
  const accessToken = await getAccessToken({ env });
  const sheetName = getToday().getFullYear().toString();
  const query = new URLSearchParams({
    valueRenderOption: "UNFORMATTED_VALUE",
    dateTimeRenderOption: "FORMATTED_STRING",
  });
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${env.SPREADSHEET_ID}/values/${sheetName}?${query}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  const sheetValues: any = await response.json();
  if (!response.ok) throw sheetValues.error;
  const [header, ...rows] = sheetValues.values;
  const result: Record<string, string>[] = [];
  for (const rowValues of rows) {
    const obj: Record<string, string> = {};
    for (let i = 0; i < rowValues.length; i++) {
      const key = header[i];
      const value = rowValues[i];
      obj[key] = value;
    }
    result.push(obj);
  }
  return result as unknown as User[];
};
