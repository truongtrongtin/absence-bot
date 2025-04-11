# Absence Bot

An intelligent Slack bot designed to streamline employee absence management.

## Features

- Submit absence requests directly from Slack
- Automatically detect absence messages and suggest creating requests
- Save absence events to Google Calendar
- Daily absence report
- View and manage personal absences
- Support for full day, morning, and afternoon absences
- Weekend and date validation
- Admin controls for message management

## Tech Stack

- [TypeScript](https://www.typescriptlang.org/)
- [Cloudflare Workers](https://workers.cloudflare.com/)
- [Slack API](https://api.slack.com/)
- [Google Calendar API](https://developers.google.com/calendar)
- [Google Sheets API](https://developers.google.com/sheets/api)
- [Itty Router](https://github.com/kwhitley/itty-router)
- [Slack Edge](https://github.com/slack-edge/slack-edge)

## Setup

1. Clone the repository
2. Rename `.dev.vars.example` to `.dev.vars` and fill in your credentials
3. Install dependencies:

```bash
npm install
```

4. Run development server:

```bash
npm run dev
```

## Deployment

The bot is automatically deployed to Cloudflare Workers using GitHub Actions when changes are pushed to the main branch. See `deploy.yml` for the deployment configuration.

## Scheduled Tasks

The bot runs a daily task (weekdays) to report absences in the configured Slack channel. See `wrangler.json` for the cron schedule.
