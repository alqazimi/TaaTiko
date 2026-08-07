import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
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
import { CoursesCatalogPage } from './pages/CoursesCatalogPage';
import { TeachersListPage } from './pages/TeachersListPage';
import { UsersPage } from './pages/UsersPage';
import { VideosPage } from './pages/VideosPage';
import { ReportsPage } from './pages/ReportsPage';
import { DisputesPage } from './pages/DisputesPage';
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
        <p className="muted">admin.taatiko.com — authorised staff only.</p>
        {!isSupabaseConfigured ? (
          <div style={{ color: 'var(--danger)', lineHeight: 1.5, marginBottom: 12 }}>
            <p style={{ margin: '0 0 8px' }}>
              Missing <code>VITE_SUPABASE_URL</code> / <code>VITE_SUPABASE_ANON_KEY</code> on this
              build.
            </p>
            <p style={{ margin: 0 }} className="muted">
              Host: {supabaseConfigStatus.urlHost} · anon key:{' '}
              {supabaseConfigStatus.hasAnonKey ? 'ok' : 'MISSING'}
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
          <div className="nav-label">Home</div>
          <NavLink to="/" end>
            Overview
          </NavLink>

          <div className="nav-label">People</div>
          <NavLink to="/users">Users</NavLink>
          <NavLink to="/teachers-list">Teachers</NavLink>
          {canReview(roles) ? <NavLink to="/teachers">Teacher applications</NavLink> : null}

          <div className="nav-label">Learn</div>
          <NavLink to="/courses">All courses</NavLink>
          {canReview(roles) ? <NavLink to="/course-review">Course review</NavLink> : null}

          <div className="nav-label">Content</div>
          <NavLink to="/videos">Videos</NavLink>
          {canModerate(roles) ? <NavLink to="/reports">Reports</NavLink> : null}

          {canFinance(roles) ? (
            <>
              <div className="nav-label">Finance</div>
              <NavLink to="/orders">Orders</NavLink>
              <NavLink to="/payouts">Payouts</NavLink>
              <NavLink to="/disputes">Disputes</NavLink>
            </>
          ) : null}

          {canModerate(roles) ? (
            <>
              <div className="nav-label">Security</div>
              <NavLink to="/audit">Audit logs</NavLink>
            </>
          ) : null}

          <div className="nav-label">System</div>
          <NavLink to="/settings">Settings</NavLink>
        </nav>
        <button
          className="btn ghost"
          style={{ marginTop: 24, width: '100%' }}
          onClick={() => void supabase.auth.signOut()}
        >
          Sign out
        </button>
      </aside>
      <main className="main">
        <Routes>
          <Route path="/" element={<OverviewPage roles={roles} />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/teachers-list" element={<TeachersListPage />} />
          <Route
            path="/teachers"
            element={canReview(roles) ? <TeacherApplicationsPage /> : <Navigate to="/" />}
          />
          <Route path="/courses" element={<CoursesCatalogPage />} />
          <Route
            path="/course-review"
            element={canReview(roles) ? <CourseReviewPage /> : <Navigate to="/" />}
          />
          <Route path="/videos" element={<VideosPage />} />
          <Route
            path="/reports"
            element={canModerate(roles) ? <ReportsPage /> : <Navigate to="/" />}
          />
          <Route path="/orders" element={canFinance(roles) ? <OrdersPage /> : <Navigate to="/" />} />
          <Route
            path="/payouts"
            element={canFinance(roles) ? <PayoutsPage /> : <Navigate to="/" />}
          />
          <Route
            path="/disputes"
            element={canFinance(roles) ? <DisputesPage /> : <Navigate to="/" />}
          />
          <Route path="/audit" element={canModerate(roles) ? <AuditPage /> : <Navigate to="/" />} />
          <Route path="/settings" element={<SettingsPage roles={roles} />} />
        </Routes>
      </main>
    </div>
  );
}
