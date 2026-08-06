# TaaTiko Admin (admin.taatiko.com)

Secure web dashboard for course reviewers, finance, moderators, and super admins.

## Setup

```bash
cd admin
cp .env.example .env   # set VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
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

## Roles

| Role | Access |
|------|--------|
| `super_admin` | Full |
| `course_reviewer` | Teachers + courses |
| `finance_admin` | Orders + payouts |
| `moderator` | Audit / reports |

## Production

- Enforce MFA (`admin_users.mfa_required`)
- Short sessions, rate limits, audit every sensitive action
- Never expose service-role key to this SPA
