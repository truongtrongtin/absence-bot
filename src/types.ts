import { SlackAppLogLevel } from "slack-edge";

export type Env = {
  SLACK_SIGNING_SECRET: string;
  SLACK_BOT_TOKEN: string;
  SLACK_LOGGING_LEVEL: SlackAppLogLevel;
  SLACK_CHANNEL: string;
  GOOGLE_CALENDAR_ID: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_REFRESH_TOKEN: string;
  GOOGLE_API_KEY: string;
  SPREADSHEET_ID: string;
  MEMBER_LIST_JSON: string;
};
export type CFArgs = [Env, ExecutionContext];

export enum DayPart {
  FULL = "full",
  MORNING = "morning",
  AFTERNOON = "afternoon",
}

export type Member = {
  id: string;
  email: string;
  name: string;
  admin: boolean;
};

export type CalendarEvent = {
  id: string;
  summary: string;
  start: {
    date: string;
  };
  end: {
    date: string;
  };
  extendedProperties: {
    private: Record<string, string>;
  };
  attendees: { email: string }[];
};

export type CalendarListResponse = {
  items: CalendarEvent[];
  nextPageToken: string;
};

export type AbsencePayload = {
  targetUserId: string;
  startDateString: string;
  endDateString: string;
  dayPart: DayPart;
  reason: string;
};
