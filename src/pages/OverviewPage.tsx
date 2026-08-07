import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { money } from '../lib/format';
import { supabase, type AdminRole } from '../lib/supabase';

type Stats = {
  users: number;
  videos: number;
  readyVideos: number;
  approvedTeachers: number;
  pendingTeachers: number;
  publishedCourses: number;
  coursesInReview: number;
  draftCourses: number;
  paidOrders: number;
  pendingOrders: number;
  gmvCents: number;
  platformCents: number;
  pendingPayouts: number;
  pendingReports: number;
  enrollments: number;
};

const empty: Stats = {
  users: 0,
  videos: 0,
  readyVideos: 0,
  approvedTeachers: 0,
  pendingTeachers: 0,
  publishedCourses: 0,
  coursesInReview: 0,
  draftCourses: 0,
  paidOrders: 0,
  pendingOrders: 0,
  gmvCents: 0,
  platformCents: 0,
  pendingPayouts: 0,
  pendingReports: 0,
  enrollments: 0,
};

export function OverviewPage({ roles }: { roles: AdminRole[] }) {
  const [stats, setStats] = useState<Stats>(empty);
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState<
    { id: string; status: string; amount_cents: number; paid_at: string | null }[]
  >([]);
  const [queueTeachers, setQueueTeachers] = useState<
    { id: string; display_name: string; email: string; created_at: string }[]
  >([]);
  const [queueCourses, setQueueCourses] = useState<
    { id: string; title: string; price_cents: number; updated_at: string }[]
  >([]);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const [
        users,
        videos,
        readyVideos,
        approvedTeachers,
        pendingTeachers,
        publishedCourses,
        coursesInReview,
        draftCourses,
        paidOrders,
        pendingOrders,
        pendingPayouts,
        pendingReports,
        enrollments,
        paidRows,
        recent,
        tQueue,
        cQueue,
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('videos').select('id', { count: 'exact', head: true }).is('deleted_at', null),
        supabase
          .from('videos')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'ready')
          .is('deleted_at', null),
        supabase
          .from('teacher_profiles')
          .select('user_id', { count: 'exact', head: true })
          .eq('status', 'approved'),
        supabase
          .from('teacher_applications')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),
        supabase.from('courses').select('id', { count: 'exact', head: true }).eq('status', 'published'),
        supabase
          .from('courses')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'under_review'),
        supabase.from('courses').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
        supabase.from('course_purchases').select('id', { count: 'exact', head: true }).eq('status', 'paid'),
        supabase
          .from('course_purchases')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),
        supabase
          .from('teacher_payouts')
          .select('id', { count: 'exact', head: true })
          .in('status', ['pending', 'approved', 'processing']),
        supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase
          .from('student_course_access')
          .select('id', { count: 'exact', head: true })
          .is('revoked_at', null),
        supabase
          .from('course_purchases')
          .select('amount_cents, platform_commission_cents')
          .eq('status', 'paid'),
        supabase
          .from('course_purchases')
          .select('id, status, amount_cents, paid_at')
          .order('created_at', { ascending: false })
          .limit(8),
        supabase
          .from('teacher_applications')
          .select('id, display_name, email, created_at')
          .eq('status', 'pending')
          .order('created_at', { ascending: true })
          .limit(5),
        supabase
          .from('courses')
          .select('id, title, price_cents, updated_at')
          .eq('status', 'under_review')
          .order('updated_at', { ascending: true })
          .limit(5),
      ]);

      const gmv = (paidRows.data ?? []).reduce((s, r) => s + (r.amount_cents ?? 0), 0);
      const platform = (paidRows.data ?? []).reduce(
        (s, r) => s + (r.platform_commission_cents ?? 0),
        0,
      );

      setStats({
        users: users.count ?? 0,
        videos: videos.count ?? 0,
        readyVideos: readyVideos.count ?? 0,
        approvedTeachers: approvedTeachers.count ?? 0,
        pendingTeachers: pendingTeachers.count ?? 0,
        publishedCourses: publishedCourses.count ?? 0,
        coursesInReview: coursesInReview.count ?? 0,
        draftCourses: draftCourses.count ?? 0,
        paidOrders: paidOrders.count ?? 0,
        pendingOrders: pendingOrders.count ?? 0,
        gmvCents: gmv,
        platformCents: platform,
        pendingPayouts: pendingPayouts.count ?? 0,
        pendingReports: pendingReports.count ?? 0,
        enrollments: enrollments.count ?? 0,
      });
      setRecentOrders((recent.data as typeof recentOrders) ?? []);
      setQueueTeachers((tQueue.data as typeof queueTeachers) ?? []);
      setQueueCourses((cQueue.data as typeof queueCourses) ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Overview</h2>
          <p className="muted">
            Super admin console · roles: {roles.join(', ')}
            {loading ? ' · refreshing…' : ''}
          </p>
        </div>
      </div>

      <h3 className="section-title">Platform</h3>
      <div className="grid">
        <div className="stat">
          <strong>{stats.users}</strong>Users
        </div>
        <div className="stat">
          <strong>{stats.videos}</strong>Videos
          <span className="stat-sub">{stats.readyVideos} ready</span>
        </div>
        <div className="stat">
          <strong>{stats.approvedTeachers}</strong>Teachers
          <span className="stat-sub">{stats.pendingTeachers} pending</span>
        </div>
        <div className="stat">
          <strong>{stats.pendingReports}</strong>Open reports
        </div>
      </div>

      <h3 className="section-title">Learn marketplace</h3>
      <div className="grid">
        <div className="stat">
          <strong>{stats.publishedCourses}</strong>Active courses
          <span className="stat-sub">
            {stats.coursesInReview} in review · {stats.draftCourses} drafts
          </span>
        </div>
        <div className="stat">
          <strong>{stats.enrollments}</strong>Enrollments
        </div>
        <div className="stat">
          <strong>{stats.paidOrders}</strong>Paid orders
          <span className="stat-sub">{stats.pendingOrders} pending checkout</span>
        </div>
        <div className="stat">
          <strong>{money(stats.gmvCents)}</strong>GMV
          <span className="stat-sub">Platform cut {money(stats.platformCents)}</span>
        </div>
        <div className="stat">
          <strong>{stats.pendingPayouts}</strong>Payouts queue
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: 20 }}>
        <div className="card">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0 }}>Teacher queue</h3>
            <Link to="/teachers">View all</Link>
          </div>
          {queueTeachers.length === 0 ? (
            <p className="muted">No pending applications.</p>
          ) : (
            queueTeachers.map((t) => (
              <div key={t.id} className="list-row">
                <div>
                  <strong>{t.display_name}</strong>
                  <div className="muted">{t.email}</div>
                </div>
                <span className="badge">pending</span>
              </div>
            ))
          )}
        </div>

        <div className="card">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0 }}>Course review</h3>
            <Link to="/course-review">View all</Link>
          </div>
          {queueCourses.length === 0 ? (
            <p className="muted">Queue empty.</p>
          ) : (
            queueCourses.map((c) => (
              <div key={c.id} className="list-row">
                <div>
                  <strong>{c.title}</strong>
                  <div className="muted">{money(c.price_cents)}</div>
                </div>
                <span className="badge">under_review</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0 }}>Recent orders</h3>
          <Link to="/orders">Orders</Link>
        </div>
        <table>
          <thead>
            <tr>
              <th>Status</th>
              <th>Amount</th>
              <th>Paid</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((o) => (
              <tr key={o.id}>
                <td>
                  <span className="badge">{o.status}</span>
                </td>
                <td>{money(o.amount_cents)}</td>
                <td className="muted">
                  {o.paid_at ? new Date(o.paid_at).toLocaleString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>Quick links</h3>
        <div className="row">
          <Link className="btn ghost" to="/users">
            Users
          </Link>
          <Link className="btn ghost" to="/courses">
            All courses
          </Link>
          <Link className="btn ghost" to="/teachers-list">
            Teachers
          </Link>
          <Link className="btn ghost" to="/videos">
            Videos
          </Link>
          <Link className="btn ghost" to="/reports">
            Reports
          </Link>
          <Link className="btn ghost" to="/disputes">
            Disputes
          </Link>
          <Link className="btn ghost" to="/payouts">
            Payouts
          </Link>
        </div>
        <p className="muted" style={{ marginTop: 12 }}>
          Revenue: platform 20% / teacher 80%. Stripe fees absorbed by platform when
          fee_policy = platform_absorbs_stripe.
        </p>
      </div>
    </div>
  );
}
