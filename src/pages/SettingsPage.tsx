import type { AdminRole } from '../lib/supabase';

export function SettingsPage({ roles }: { roles: AdminRole[] }) {
  return (
    <div>
      <h2>System settings</h2>
      <div className="card">
        <h3>Security</h3>
        <ul className="muted">
          <li>Require MFA for all admin_users (mfa_required flag).</li>
          <li>Session expiration via Supabase JWT + short refresh on admin host.</li>
          <li>Role-based modules: course_reviewer cannot issue payouts; finance_admin cannot edit courses.</li>
          <li>Confirm dialogs on approve / payout / reject.</li>
          <li>Payout account numbers masked in UI except last 4 for finance.</li>
        </ul>
      </div>
      <div className="card">
        <h3>Your roles</h3>
        <p>{roles.map((r) => <span key={r} className="badge" style={{ marginRight: 6 }}>{r}</span>)}</p>
      </div>
      <div className="card">
        <h3>Deploy</h3>
        <p className="muted">
          Host this Vite app at <strong>admin.taatiko.com</strong>. Set VITE_SUPABASE_URL and
          VITE_SUPABASE_ANON_KEY. Restrict CORS / Allowed Origins to the admin domain.
        </p>
      </div>
    </div>
  );
}
