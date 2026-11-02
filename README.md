# Control Your Flat

A small web app for flatmates to share household duties. It shows who is on duty each day of the month, who takes out the rubbish, and who does the general cleaning. An admin can add, edit, reorder and remove residents.

Built with React 19, React Router 7, Bootstrap 5, Sass and [Supabase](https://supabase.com) (database and authentication).

## Features

- **Duties schedule** (`/duties-schedule`): three monthly tables, one each for daily duty (*navbatchilik*), rubbish (*musor tashlash*) and general cleaning (*generalniy uborka*). Today's column and today's person are highlighted, and the date refreshes every minute.
- **Users** (`/users`): a public list of residents with Telegram links and phone numbers.
- **Control Users** (`/control-users`, admins only): add, edit and delete residents and set their duty order. Positions shift automatically when someone is inserted, moved or deleted.
- **Login**: email and password sign-in through Supabase Auth, from the "Log in" button in the header. Only users whose `role` is `admin` get access to the admin page.
- Responsive layout with a hamburger menu on small screens.

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

| Command         | What it does                                  |
| --------------- | --------------------------------------------- |
| `npm start`     | Start the development server                  |
| `npm run build` | Create a production build in `build/`         |
| `npm test`      | Run tests in watch mode                       |
| `npx prettier --write src` | Format the code using `.prettierrc` |

## Supabase setup

The Supabase client is configured in [src/lib/supabese.jsx](src/lib/supabese.jsx). To use your own project, replace `supabaseUrl` and `supabaseKey` there with your project URL and **publishable (anon)** key. Never put a service-role key in this file; it is shipped to the browser.

The app expects the following in your Supabase project.

### `users` table

| Column         | Type        | Notes                                              |
| -------------- | ----------- | -------------------------------------------------- |
| `user_id`      | uuid        | Primary key; matches `auth.users.id` for anyone who logs in |
| `role`         | text        | `admin` or `user`                                  |
| `name`         | text        |                                                    |
| `last_name`    | text        |                                                    |
| `age`          | int         |                                                    |
| `duty_order`   | int         | Position in the duty rotation (1, 2, 3, …)         |
| `rubbish_order` | int        | Position in the rubbish rotation                   |
| `cleaning_order` | int       | Position in the deep cleaning rotation (pairs: 1–2, 3–4, …) |
| `nickname`     | text        | Telegram username, e.g. `@username`                |
| `phone_number` | text        |                                                    |
| `email`        | text        |                                                    |

### Database functions (RPC)

The database objects live in the Supabase project. Run
[supabase/migrations/20261102_per_task_orders_and_history.sql](supabase/migrations/20261102_per_task_orders_and_history.sql)
once in **Supabase → SQL Editor** to create them.

| Function | Used for |
| --- | --- |
| `get_duty_schedule(target_date date)` | Returns `{ duty, rubbish, cleaning[] }` for a day. Past days come from `duty_history`, other days from `compute_duty_schedule` |
| `compute_duty_schedule(target_date date)` | The rotation formula: duty by `duty_order` every day, rubbish by `rubbish_order` every 3rd day, deep cleaning by `cleaning_order` in pairs every 7th day |
| `move_user_in_order(p_task, p_user_id, p_new_order)` | Moves a user within one task's order (`duty`, `rubbish` or `cleaning`); others shift |
| `swap_users_in_order(p_task, p_user_a, p_user_b)` | Swaps two users within one task's order; nobody else moves |
| `add_user(p_user jsonb, p_duty_order int)` | Inserts a user at a duty position (or at the end) and at the end of the other orders |
| `delete_user_and_shift(p_user_id uuid)` | Deletes a user and closes the gap in all three orders |
| `snapshot_duty_history()` | Saves every day from 2026-09-01 up to today (Tashkent time) into `duty_history` |

Each task has its own order column, so changing the rubbish order does not touch duty or deep cleaning. Every function that changes an order first calls `snapshot_duty_history()`, so today and past days stay as they were and the new order takes effect from tomorrow. The functions run with the caller's permissions, so Row Level Security still decides who may change the orders (admins only).

### Telegram bot

[supabase/functions/daily-schedule/index.ts](supabase/functions/daily-schedule/index.ts) is a Supabase Edge Function that posts to the flat's Telegram group. Two `pg_cron` jobs call it: `send-daily-duty-telegram` at 08:00 Tashkent time (today's duties with @mentions, tomorrow's summary, weather and the tip of the day) and `send-evening-duty-telegram` at 21:00 with `?mode=evening` (a reminder that mentions tomorrow's people). It needs the `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` secrets; set `SITE_URL` to add an "Open schedule" button.

### Creating an admin

1. Create a user in **Supabase → Authentication → Users**.
2. Add a row to `users` with the same `user_id` and `role = 'admin'`.
3. Log in from the app's header; you will be redirected to `/control-users`.

> Access control in the browser is only a convenience. Protect the `users` table and RPC functions with Row Level Security so that only admins can modify data.

## Project structure

```
src/
├── assits/styles/     # Global Sass: variables, mixins, main.scss
├── components/        # Header (nav + login modal), Loading, UserModal
├── lib/supabese.jsx   # Supabase client
├── pages/             # Home, DutiesSchedule, Users, ControlUsers, Error (404)
├── panels/            # UserPanel (placeholder)
├── routes/            # AppRoutes and ProtectedRoute (admin guard)
├── App.js
└── index.js           # Entry point: router, Bootstrap, global styles
```

## Deployment

Run `npm run build` and host the `build/` folder on any static host (Vercel, Netlify, GitHub Pages, …). Since the app uses client-side routing, configure the host to serve `index.html` for unknown paths.
