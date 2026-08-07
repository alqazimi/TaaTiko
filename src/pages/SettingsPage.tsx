import type { AdminRole } from '../lib/supabase';

export function SettingsPage({ roles }: { roles: AdminRole[] }) {
  return (
    <div>
      <h2>Settings</h2>
      <div className="card">
        <h3>What this admin is for</h3>
        <p className="muted">
          <strong>TaaTiko Learn Admin</strong> — e-learning only: students (course buyers), teachers,
          courses, orders, and payouts.
        </p>
        <p className="muted">
          Social media (public videos, feed, social reports) is <strong>not</strong> managed here.
        </p>
      </div>
      <div className="card">
        <h3>Your roles</h3>
        <p>
          {roles.map((r) => (
            <span key={r} className="badge" style={{ marginRight: 6 }}>
              {r}
            </span>
          ))}
        </p>
      </div>
      <div className="card">
        <h3>Security</h3>
        <ul className="muted">
          <li>Require MFA for admin_users in production.</li>
          <li>Never put the service-role key in this SPA.</li>
          <li>Confirm dialogs on approve / payout / reject.</li>
        </ul>
      </div>
    </div>
  );
}
