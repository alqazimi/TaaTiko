import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { money } from '../lib/format';
import { supabase, type AdminRole } from '../lib/supabase';

type Stats = {
  students: number;
  paidOrders: number;
  pendingOrders: number;
  gmvCents: number;
  platformCents: number;
  approvedTeachers: number;
  pendingTeachers: number;
  publishedCourses: number;
  coursesInReview: number;
  draftCourses: number;
  enrollments: number;
  pendingPayouts: number;
};

const empty: Stats = {
  students: 0,
  paidOrders: 0,
  pendingOrders: 0,
  gmvCents: 0,
  platformCents: 0,
  approvedTeachers: 0,
  pendingTeachers: 0,
  publishedCourses: 0,
  coursesInReview: 0,
  draftCourses: 0,
  enrollments: 0,
  pendingPayouts: 0,
};

/** Learn marketplace admin only — no social media metrics. */
export function OverviewPage({ roles }: { roles: AdminRole[] }) {
  const [stats, setStats] = useState<Stats>(empty);
  const [loading, setLoading] = useState(true);
  const [recentStudents, setRecentStudents] = useState<
    {
      id: string;
      amount_cents: number;
      paid_at: string | null;
      course?: { title: string } | null;
      student?: { username: string; display_name: string | null } | null;
    }[]
  >([]);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const [
        paidOrders,
        pendingOrders,
        approvedTeachers,
        pendingTeachers,
        publishedCourses,
        coursesInReview,
        draftCourses,
        enrollments,
        pendingPayouts,
        paidRows,
        studentIds,
        recent,
      ] = await Promise.all([
        supabase.from('course_purchases').select('id', { count: 'exact', head: true }).eq('status', 'paid'),
        supabase
          .from('course_purchases')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),
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
        supabase
          .from('student_course_access')
          .select('id', { count: 'exact', head: true })
          .is('revoked_at', null),
        supabase
          .from('teacher_payouts')
          .select('id', { count: 'exact', head: true })
          .in('status', ['pending', 'approved', 'processing']),
        supabase
          .from('course_purchases')
          .select('amount_cents, platform_commission_cents, student_id')
          .eq('status', 'paid'),
        supabase.from('course_purchases').select('student_id').eq('status', 'paid'),
        supabase
          .from('course_purchases')
          .select(
            'id, amount_cents, paid_at, course:courses(title), student:profiles!course_purchases_student_id_fkey(username, display_name)',
          )
          .eq('status', 'paid')
          .order('paid_at', { ascending: false })
          .limit(8),
      ]);

      const gmv = (paidRows.data ?? []).reduce((s, r) => s + (r.amount_cents ?? 0), 0);
      const platform = (paidRows.data ?? []).reduce(
        (s, r) => s + (r.platform_commission_cents ?? 0),
        0,
      );
      const uniqueStudents = new Set(
        (studentIds.data ?? []).map((r) => r.student_id as string),
      ).size;

      setStats({
        students: uniqueStudents,
        paidOrders: paidOrders.count ?? 0,
        pendingOrders: pendingOrders.count ?? 0,
        gmvCents: gmv,
        platformCents: platform,
        approvedTeachers: approvedTeachers.count ?? 0,
        pendingTeachers: pendingTeachers.count ?? 0,
        publishedCourses: publishedCourses.count ?? 0,
        coursesInReview: coursesInReview.count ?? 0,
        draftCourses: draftCourses.count ?? 0,
        enrollments: enrollments.count ?? 0,
        pendingPayouts: pendingPayouts.count ?? 0,
      });

      setRecentStudents(
        ((recent.data ?? []) as unknown as Array<{
          id: string;
          amount_cents: number;
          paid_at: string | null;
          course: unknown;
          student: unknown;
        }>).map((r) => ({
          id: r.id,
          amount_cents: r.amount_cents,
          paid_at: r.paid_at,
          course: Array.isArray(r.course) ? r.course[0] ?? null : (r.course as { title: string } | null),
          student: Array.isArray(r.student)
            ? r.student[0] ?? null
            : (r.student as { username: string; display_name: string | null } | null),
        })),
      );
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Learn overview</h2>
          <p className="muted">
            E-learning admin only (not social media) · {roles.join(', ')}
            {loading ? ' · refreshing…' : ''}
          </p>
        </div>
      </div>

      <h3 className="section-title">Students & sales</h3>
      <div className="grid">
        <div className="stat">
          <strong>{stats.students}</strong>Students
          <span className="stat-sub">Users who bought at least one course</span>
        </div>
        <div className="stat">
          <strong>{stats.paidOrders}</strong>Paid purchases
          <span className="stat-sub">{stats.pendingOrders} pending checkout</span>
        </div>
        <div className="stat">
          <strong>{stats.enrollments}</strong>Active enrollments
        </div>
        <div className="stat">
          <strong>{money(stats.gmvCents)}</strong>GMV
          <span className="stat-sub">Platform {money(stats.platformCents)} (20%)</span>
        </div>
      </div>

      <h3 className="section-title">Courses & teachers</h3>
      <div className="grid">
        <div className="stat">
          <strong>{stats.publishedCourses}</strong>Active courses
          <span className="stat-sub">
            {stats.coursesInReview} in review · {stats.draftCourses} drafts
          </span>
        </div>
        <div className="stat">
          <strong>{stats.approvedTeachers}</strong>Teachers
          <span className="stat-sub">{stats.pendingTeachers} applications pending</span>
        </div>
        <div className="stat">
          <strong>{stats.pendingPayouts}</strong>Manual payouts due
          <span className="stat-sub">Somali / EVC only — not Stripe</span>
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0 }}>Recent students (buyers)</h3>
          <Link to="/students">View all students</Link>
        </div>
        {recentStudents.length === 0 ? (
          <p className="muted">No paid course purchases yet.</p>
        ) : (
          <div className="table-scroll">
<table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Course</th>
                <th>Paid</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {recentStudents.map((r) => (
                <tr key={r.id}>
                  <td>
                    <strong>
                      {r.student?.display_name || r.student?.username || 'Student'}
                    </strong>
                    <div className="muted">
                      {r.student?.username ? `@${r.student.username}` : ''}
                    </div>
                  </td>
                  <td>{r.course?.title ?? '—'}</td>
                  <td>{money(r.amount_cents)}</td>
                  <td className="muted">
                    {r.paid_at ? new Date(r.paid_at).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      <div className="card">
        <h3>Quick links</h3>
        <div className="row">
          <Link className="btn ghost" to="/students">
            Students
          </Link>
          <Link className="btn ghost" to="/courses">
            Courses
          </Link>
          <Link className="btn ghost" to="/teachers-list">
            Teachers
          </Link>
          <Link className="btn ghost" to="/orders">
            Orders
          </Link>
          <Link className="btn ghost" to="/payouts">
            Manual payouts
          </Link>
        </div>
        <p className="muted" style={{ marginTop: 12 }}>
          Social feed videos and public social reports are not managed here. This console is Learn
          marketplace only.
        </p>
      </div>
    </div>
  );
}
