# Control Your Flat

A web app for flatmates to share household duties. Anyone can sign up, create their flat, add flatmates and invite them by link. Each flat sees only its own data: who is on daily duty, who takes out the rubbish and who does the deep cleaning.

Built with React 19, React Router 7, Bootstrap 5, Sass and [Supabase](https://supabase.com) (Postgres, Auth, Row Level Security and Edge Functions).

## Features

- **Accounts:** sign up, log in and reset your password with email and password through Supabase Auth.
- **Flats:** a user can own up to 5 flats and be a member of others. The header menu switches between them.
- **Invite links** (`/invite/:code`): the owner creates a link for a flatmate. The flatmate signs up and is linked to their row in the flat. Links work once and expire after 7 days.
- **Rules per flat** (`/settings`, owner only):
  - turn each task (duty, rubbish, deep cleaning) on or off;
  - set how often it repeats (every N days);
  - set how many people take a turn.
- **Home:**
  - today's tasks and a personal greeting;
  - "Done" buttons for your own tasks and a monthly rating;
  - weather for the flat's location;
  - the next 7 days.
- **Duties schedule** (`/duties-schedule`):
  - monthly tables or a calendar;
  - a filter by person;
  - stats;
  - `.ics` export.
- **Manage flatmates** (`/control-users`, owner only):
  - add, edit and delete flatmates;
  - drag to reorder each task's rotation, or swap two people;
  - send invite links.
- Dark mode, uz/ru/en translations, installable PWA with offline cache, and a Telegram bot.

## Getting started

Requirements: Node.js 18+ and npm.

```bash
git clone https://github.com/zahriddinus/control-your-flat.git
cd control-your-flat
npm install
npm start
```

The app runs at <http://localhost:3000>.

### Scripts

| Command                    | What it does                          |
| -------------------------- | ------------------------------------- |
| `npm start`                | Start the development server          |
| `npm run build`            | Create a production build in `build/` |
| `npx prettier --write src` | Format the code using `.prettierrc`   |

## Supabase setup

The Supabase client is configured in [src/lib/supabese.jsx](src/lib/supabese.jsx). To use your own project, replace `supabaseUrl` and `supabaseKey` there with your project URL and **publishable (anon)** key. Never put a service-role key in this file, because it is shipped to the browser.

Run the migrations in **Supabase → SQL Editor**, in this order:

1. [20261102_per_task_orders_and_history.sql](supabase/migrations/20261102_per_task_orders_and_history.sql)
2. [20261102_schedule_range.sql](supabase/migrations/20261102_schedule_range.sql)
3. [20261106_duty_done.sql](supabase/migrations/20261106_duty_done.sql)
4. [20261107_multi_flat.sql](supabase/migrations/20261107_multi_flat.sql). This one turns the single-flat database into the multi-flat one. It moves existing residents into a first flat named "Sergeli" and keeps a copy of the old tables in the `backup` schema.

In **Authentication → URL Configuration**, set the **Site URL** to your production address. Add `http://localhost:3000/**` and your production URL to **Redirect URLs**. Confirmation and password-reset emails link there.

### Tables

| Table | What it holds |
| --- | --- |
| `flats` | Name, rotation start date, time zone, address and coordinates (for the weather), optional `telegram_chat_id` |
| `flat_members` | Which account belongs to which flat (`owner` or `member`) and which flatmate row (`resident_id`) it is |
| `flat_tasks` | Per-flat rules: `enabled`, `every_days`, `people` for `duty`, `rubbish` and `cleaning` |
| `invites` | Invite links for a flatmate, valid for 7 days and usable once |
| `users` | Flatmates of a flat (`flat_id`): name, contacts and one order column per task |
| `duty_history` | Frozen past days, so changing orders or rules never rewrites the past |
| `duty_done` | "Done" marks per day, task and flatmate |

Row Level Security:

- members can read their own flat's data;
- only the owner can change flatmates, orders and rules;
- visitors who aren't logged in can read nothing except the short invite preview (`get_invite`).

### Database functions (RPC)

| Function | Used for |
| --- | --- |
| `get_duty_schedule(p_flat, target_date)` / `get_duty_schedule_range(p_flat, start_date, end_date)` | `{ duty: [], rubbish: [], cleaning: [] }` per day. Past days come from `duty_history`; other days are computed from the flat's rules |
| `create_flat(...)` | Creates a flat with the owner as its first flatmate and the default rules |
| `update_flat(p_flat, p_patch)` / `update_flat_task(p_flat, p_task, ...)` | Change flat details or a task rule (the past is snapshotted first) |
| `add_user`, `move_user_in_order`, `swap_users_in_order`, `delete_user_and_shift` | Manage flatmates and per-task orders inside one flat |
| `create_invite`, `get_invite`, `accept_invite` | Invite links |
| `mark_task_done(p_flat, p_task)` / `unmark_task_done(...)` | Mark your own task for today. The owner can also mark a task for a flatmate |

### Telegram bot

[supabase/functions/daily-schedule/index.ts](supabase/functions/daily-schedule/index.ts) is an Edge Function that posts to each flat's Telegram group. A flat gets messages if `flats.telegram_chat_id` is set. The oldest flat falls back to the `TELEGRAM_CHAT_ID` secret.

Two `pg_cron` jobs call it:

- `send-daily-duty-telegram` at 08:00 Tashkent time;
- `send-evening-duty-telegram` at 21:00, with `?mode=evening`.

Required secrets:

- `TELEGRAM_BOT_TOKEN`;
- `SUPABASE_SERVICE_ROLE_KEY`, which Supabase provides automatically.

Set `SITE_URL` to add an "Open schedule" button.

## Project structure

```
src/
├── assits/styles/   # Global Sass and dark theme
├── components/      # Header, Footer, modals, icons, skeletons, empty states, FlatForm, ...
├── context/         # AuthContext (session) and FlatContext (current flat, role, rules)
├── i18n/            # uz / ru / en dictionaries
├── lib/supabese.jsx # Supabase client
├── pages/           # Landing, Auth, NewFlat, Invite, Home, DutiesSchedule, Users, ControlUsers, Settings
├── routes/          # AppRoutes and guards (RequireAuth, RequireFlat, RequireOwner)
└── utils/           # Schedule, "done" marks, dates, weather, offline cache, .ics
```

## Deployment

Run `npm run build` and host the `build/` folder on any static host (Vercel, Netlify, …). The app uses client-side routing, so configure the host to serve `index.html` for unknown paths.
