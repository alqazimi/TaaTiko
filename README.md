# TaaTiko Learn Admin

E-learning marketplace admin only — **not** social media.

## Scope

| Included | Not included |
|----------|----------------|
| Students (users who bought courses) | Public feed videos |
| Teachers & applications | Social reports |
| Courses & review queue | Generic social user directory |
| Orders, payouts, disputes | |

## Setup

```bash
cd admin
cp .env.example .env   # VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

Promote a user:

```sql
insert into admin_users (user_id) values ('<profile uuid>') on conflict do nothing;
insert into admin_user_roles (user_id, role) values ('<profile uuid>', 'super_admin')
on conflict do nothing;
update profiles set is_admin = true where id = '<profile uuid>';
```

## Main pages

- **Overview** — students, GMV, active courses, teachers
- **Course buyers (Students)** — who purchased which course
- **Teachers / Applications / Courses / Orders / Payouts**
