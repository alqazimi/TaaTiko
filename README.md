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

Apply moderation RLS (reports / all videos for admins):

```bash
supabase db push
# or run migration 20260807010000_admin_moderation_rls.sql in SQL Editor
```

## Pages

| Section | Pages |
|---------|--------|
| Overview | Users, videos, teachers, active courses, GMV, queues |
| People | Users, Teachers, Teacher applications |
| Learn | All courses (by status), Course review queue |
| Content | Videos, Reports |
| Finance | Orders, Payouts, Disputes |
| Security | Audit logs |
| System | Settings |

## Roles

| Role | Access |
|------|--------|
| `super_admin` | Full |
| `course_reviewer` | Teachers + courses |
| `finance_admin` | Orders + payouts + disputes |
| `moderator` | Audit / reports |

## Production

- Enforce MFA (`admin_users.mfa_required`)
- Short sessions, rate limits, audit every sensitive action
- Never expose service-role key to this SPA
