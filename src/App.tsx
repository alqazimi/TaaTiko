import { useEffect, useState } from 'react';
import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import {
  canFinance,
  canModerate,
  canReview,
  fetchAdminRoles,
  isSupabaseConfigured,
  supabase,
  supabaseConfigStatus,
  type AdminRole,
} from './lib/supabase';
import { OverviewPage } from './pages/OverviewPage';
import { TeacherApplicationsPage } from './pages/TeacherApplicationsPage';
import { CourseReviewPage } from './pages/CourseReviewPage';
import { PayoutsPage } from './pages/PayoutsPage';
import { OrdersPage } from './pages/OrdersPage';
import { AuditPage } from './pages/AuditPage';
import { SettingsPage } from './pages/SettingsPage';

export function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    void supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        setRoles(await fetchAdminRoles(data.session.user.id));
      }
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, next) => {
      setSession(next);
      if (next?.user) {
        void fetchAdminRoles(next.user.id).then(setRoles);
      } else {
        setRoles([]);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (loading) return <div className="main">Loading…</div>;

  if (!session) {
    return (
      <div className="card login">
        <h1 style={{ color: 'var(--cyan)' }}>TaaTiko Admin</h1>
        <p className="muted">admin.taatiko.com — authorised staff only. Enable MFA in production.</p>
        {!isSupabaseConfigured ? (
          <div style={{ color: 'var(--danger)', lineHeight: 1.5, marginBottom: 12 }}>
            <p style={{ margin: '0 0 8px' }}>
              Supabase API key is missing from this Vercel build. That causes:{' '}
              <code>No API key found in request</code>.
            </p>
            <p style={{ margin: '0 0 8px' }} className="muted">
              Build status — URL: {supabaseConfigStatus.hasUrl ? supabaseConfigStatus.urlHost : 'missing'} ·
              anon key: {supabaseConfigStatus.hasAnonKey ? `ok (${supabaseConfigStatus.anonKeyLength} chars)` : 'MISSING'}
            </p>
            <p style={{ margin: 0 }}>
              In Vercel → Settings → Environment Variables add both{' '}
              <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> (Production), then
              Redeploy with build cache disabled.
            </p>
          </div>
        ) : null}
        <label className="muted">Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
        <label className="muted">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        {error ? <p style={{ color: 'var(--danger)' }}>{error}</p> : null}
        <button
          className="btn"
          disabled={!isSupabaseConfigured}
          onClick={async () => {
            setError('');
            const { error: err } = await supabase.auth.signInWithPassword({ email, password });
            if (err) setError(err.message);
          }}
        >
          Sign in
        </button>
      </div>
    );
  }

  if (roles.length === 0) {
    return (
      <div className="card login">
        <h2>Access denied</h2>
        <p className="muted">This account is not an administrator.</p>
        <button className="btn ghost" onClick={() => void supabase.auth.signOut()}>
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <h1>TaaTiko</h1>
        <p>Admin · {roles.join(', ')}</p>
        <nav className="nav">
          <NavLink to="/" end>
            Overview
          </NavLink>
          {canReview(roles) ? (
            <>
              <NavLink to="/teachers">Teacher applications</NavLink>
              <NavLink to="/courses">Course review</NavLink>
            </>
          ) : null}
          {canFinance(roles) ? (
            <>
              <NavLink to="/orders">Orders & refunds</NavLink>
              <NavLink to="/payouts">Monthly payouts</NavLink>
            </>
          ) : null}
          {canModerate(roles) ? <NavLink to="/audit">Audit logs</NavLink> : null}
          <NavLink to="/settings">Settings</NavLink>
        </nav>
        <button className="btn ghost" style={{ marginTop: 24, width: '100%' }} onClick={() => void supabase.auth.signOut()}>
          Sign out
        </button>
      </aside>
      <main className="main">
        <Routes>
          <Route path="/" element={<OverviewPage roles={roles} />} />
          <Route
            path="/teachers"
            element={canReview(roles) ? <TeacherApplicationsPage /> : <Navigate to="/" />}
          />
          <Route
            path="/courses"
            element={canReview(roles) ? <CourseReviewPage /> : <Navigate to="/" />}
          />
          <Route path="/orders" element={canFinance(roles) ? <OrdersPage /> : <Navigate to="/" />} />
          <Route path="/payouts" element={canFinance(roles) ? <PayoutsPage /> : <Navigate to="/" />} />
          <Route path="/audit" element={canModerate(roles) ? <AuditPage /> : <Navigate to="/" />} />
          <Route path="/settings" element={<SettingsPage roles={roles} />} />
        </Routes>
      </main>
    </div>
  );
}
