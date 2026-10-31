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
| `duty_order`   | int         | Position in the rotation (1, 2, 3, …)              |
| `nickname`     | text        | Telegram username, e.g. `@username`                |
| `phone_number` | text        |                                                    |
| `email`        | text        |                                                    |

### Database functions (RPC)

| Function                                         | Used for                                                       |
| ------------------------------------------------ | -------------------------------------------------------------- |
| `get_duty_schedule(target_date date)`            | Returns `{ duty, rubbish, cleaning[] }` for a given day; each entry has a `user_id` |
| `move_user_to_order(p_user_id, p_new_order)`     | Moves a user to a new position and shifts the others           |
| `shift_users_for_insert(p_new_order)`            | Makes room for a new user at a given position                  |
| `shift_users_after_delete(p_deleted_order)`      | Closes the gap after a user is deleted                         |
| `delete_user_and_shift(p_user_id uuid)`          | Deletes a user and closes the gap in one transaction (used by the admin page) |

These functions are not stored in this repository; they live in the Supabase project. `delete_user_and_shift` wraps the delete and `shift_users_after_delete`, so if shifting fails the delete is rolled back. To create it, run this in **Supabase → SQL Editor**:

```sql
create or replace function public.delete_user_and_shift(p_user_id uuid)
returns void
language plpgsql
set search_path = public
as $$
declare
  v_order integer;
begin
  delete from public.users
  where user_id = p_user_id
  returning duty_order into v_order;

  if not found then
    raise exception 'User topilmadi yoki o''chirishga ruxsat yo''q';
  end if;

  perform public.shift_users_after_delete(p_deleted_order => v_order);
end;
$$;

revoke execute on function public.delete_user_and_shift(uuid) from anon;
```

It runs with the caller's permissions, so Row Level Security still decides who may delete. Keep `search_path = public`: `shift_users_after_delete` refers to `users` without the `public.` prefix and fails with an empty search path.

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
