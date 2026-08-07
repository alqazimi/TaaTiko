import { useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
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
import { StudentsPage } from './pages/StudentsPage';
import { TeacherApplicationsPage } from './pages/TeacherApplicationsPage';
import { CourseReviewPage } from './pages/CourseReviewPage';
import { CoursesCatalogPage } from './pages/CoursesCatalogPage';
import { TeachersListPage } from './pages/TeachersListPage';
import { DisputesPage } from './pages/DisputesPage';
import { PayoutsPage } from './pages/PayoutsPage';
import { OrdersPage } from './pages/OrdersPage';
import { AuditPage } from './pages/AuditPage';
import { SettingsPage } from './pages/SettingsPage';

function NavItem({ to, end, children }: { to: string; end?: boolean; children: ReactNode }) {
  return (
    <NavLink to={to} end={end}>
      <span className="nav-dot" aria-hidden />
      {children}
    </NavLink>
  );
}

export function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();

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

  // Close drawer on route change (phone).
  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = navOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [navOpen]);

  if (loading) {
    return (
      <div className="loading-shell">
        <div className="spinner" />
        <span>Loading admin…</span>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="auth-shell">
        <div className="card login">
          <div className="brand" style={{ marginBottom: 18 }}>
            <div className="brand-mark">TT</div>
            <div>
              <h1>TaaTiko Learn</h1>
              <p>Admin console</p>
            </div>
          </div>
          <p className="muted">
            E-learning only — teachers, courses, students & sales. Not social media.
          </p>
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
      </div>
    );
  }

  if (roles.length === 0) {
    return (
      <div className="auth-shell">
        <div className="card login">
          <h2>Access denied</h2>
          <p className="muted">This account is not an administrator.</p>
          <button className="btn ghost" onClick={() => void supabase.auth.signOut()}>
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`layout${navOpen ? ' nav-open' : ''}`}>
      <div
        className="nav-backdrop"
        onClick={() => setNavOpen(false)}
        aria-hidden={!navOpen}
      />

      <header className="topbar">
        <button
          type="button"
          className="icon-btn"
          aria-label="Open menu"
          onClick={() => setNavOpen(true)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M4 7h16M4 12h16M4 17h16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <div className="topbar-title">TaaTiko Learn</div>
        <button
          type="button"
          className="icon-btn"
          aria-label="Sign out"
          onClick={() => void supabase.auth.signOut()}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M10 7V5a2 2 0 0 1 2-2h7v18h-7a2 2 0 0 1-2-2v-2M15 12H3m0 0 3-3m-3 3 3 3"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </header>

      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">TT</div>
          <div>
            <h1>TaaTiko Learn</h1>
            <p>{roles.join(' · ')}</p>
          </div>
        </div>

        <nav className="nav" aria-label="Admin">
          <div className="nav-label">Home</div>
          <NavItem to="/" end>
            Overview
          </NavItem>

          <div className="nav-label">Students</div>
          <NavItem to="/students">Course buyers</NavItem>
          {canFinance(roles) ? <NavItem to="/orders">Orders</NavItem> : null}

          <div className="nav-label">Teachers</div>
          <NavItem to="/teachers-list">Teachers</NavItem>
          {canReview(roles) ? <NavItem to="/teachers">Applications</NavItem> : null}

          <div className="nav-label">Courses</div>
          <NavItem to="/courses">All courses</NavItem>
          {canReview(roles) ? <NavItem to="/course-review">Review queue</NavItem> : null}

          {canFinance(roles) ? (
            <>
              <div className="nav-label">Finance</div>
              <NavItem to="/payouts">Manual payouts</NavItem>
              <NavItem to="/disputes">Disputes</NavItem>
            </>
          ) : null}

          {canModerate(roles) ? (
            <>
              <div className="nav-label">System</div>
              <NavItem to="/audit">Audit logs</NavItem>
            </>
          ) : null}

          <NavItem to="/settings">Settings</NavItem>
        </nav>

        <div className="sidebar-foot">
          <button
            className="btn ghost"
            style={{ width: '100%' }}
            onClick={() => void supabase.auth.signOut()}
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="main">
        <Routes>
          <Route path="/" element={<OverviewPage roles={roles} />} />
          <Route path="/students" element={<StudentsPage />} />
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
          <Route path="/users" element={<Navigate to="/students" replace />} />
          <Route path="/videos" element={<Navigate to="/" replace />} />
          <Route path="/reports" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
