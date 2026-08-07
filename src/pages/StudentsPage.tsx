import { useEffect, useMemo, useState } from 'react';
import { money, shortId, when } from '../lib/format';
import { supabase } from '../lib/supabase';

type StudentPurchase = {
  id: string;
  status: string;
  amount_cents: number;
  platform_commission_cents: number;
  teacher_share_cents: number;
  paid_at: string | null;
  created_at: string;
  student_id: string;
  teacher_id: string;
  course_id: string;
  course?: { title: string } | null;
  student?: { username: string; display_name: string | null } | null;
  teacher?: { display_name: string } | null;
};

/**
 * E-learning only: users who bought courses (students), not social-media accounts.
 */
export function StudentsPage() {
  const [rows, setRows] = useState<StudentPurchase[]>([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'paid' | 'all'>('paid');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      let query = supabase
        .from('course_purchases')
        .select(
          `
          id, status, amount_cents, platform_commission_cents, teacher_share_cents,
          paid_at, created_at, student_id, teacher_id, course_id,
          course:courses(title),
          student:profiles!course_purchases_student_id_fkey(username, display_name)
        `,
        )
        .order('paid_at', { ascending: false, nullsFirst: false })
        .limit(200);
      if (status === 'paid') query = query.eq('status', 'paid');

      const { data, error } = await query;
      if (error) {
        console.warn(error.message);
        setRows([]);
        setLoading(false);
        return;
      }

      const list = ((data ?? []) as unknown as Array<
        Omit<StudentPurchase, 'course' | 'student' | 'teacher'> & {
          course: unknown;
          student: unknown;
        }
      >).map((row) => ({
        ...row,
        course: Array.isArray(row.course) ? row.course[0] ?? null : (row.course as StudentPurchase['course']),
        student: Array.isArray(row.student)
          ? row.student[0] ?? null
          : (row.student as StudentPurchase['student']),
      }));

      const teacherIds = [...new Set(list.map((r) => r.teacher_id))];
      const { data: teachers } = teacherIds.length
        ? await supabase
            .from('teacher_profiles')
            .select('user_id, display_name')
            .in('user_id', teacherIds)
        : { data: [] as { user_id: string; display_name: string }[] };
      const teacherMap = new Map(
        (teachers ?? []).map((t) => [t.user_id as string, t.display_name as string]),
      );

      setRows(
        list.map((r) => ({
          ...r,
          teacher: { display_name: teacherMap.get(r.teacher_id) ?? shortId(r.teacher_id) },
        })),
      );
      setLoading(false);
    })();
  }, [status]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((r) => {
      const name = (r.student?.display_name ?? '').toLowerCase();
      const user = (r.student?.username ?? '').toLowerCase();
      const course = (r.course?.title ?? '').toLowerCase();
      const teacher = (r.teacher?.display_name ?? '').toLowerCase();
      return (
        name.includes(needle) ||
        user.includes(needle) ||
        course.includes(needle) ||
        teacher.includes(needle) ||
        r.student_id.toLowerCase().includes(needle)
      );
    });
  }, [q, rows]);

  const uniqueStudents = useMemo(
    () => new Set(filtered.filter((r) => r.status === 'paid').map((r) => r.student_id)).size,
    [filtered],
  );

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Students</h2>
          <p className="muted">
            E-learning buyers only — who purchased a course
            {loading ? ' · loading…' : ` · ${uniqueStudents} students · ${filtered.length} purchases`}
          </p>
        </div>
        <input
          style={{ maxWidth: 280, margin: 0 }}
          placeholder="Search student, course, teacher"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="row" style={{ marginBottom: 12 }}>
        <button
          className={`btn ghost${status === 'paid' ? ' active-filter' : ''}`}
          onClick={() => setStatus('paid')}
        >
          Paid (students)
        </button>
        <button
          className={`btn ghost${status === 'all' ? ' active-filter' : ''}`}
          onClick={() => setStatus('all')}
        >
          All checkouts
        </button>
      </div>

      <div className="card">
        {filtered.length === 0 && !loading ? (
          <p className="muted">No course purchases yet. When a user buys a course, they appear here as a student.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Course</th>
                <th>Teacher</th>
                <th>Status</th>
                <th>Paid</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td>
                    <strong>{r.student?.display_name || r.student?.username || shortId(r.student_id)}</strong>
                    <div className="muted">
                      {r.student?.username ? `@${r.student.username}` : shortId(r.student_id)}
                    </div>
                  </td>
                  <td>
                    <strong>{r.course?.title ?? shortId(r.course_id)}</strong>
                  </td>
                  <td className="muted">{r.teacher?.display_name ?? '—'}</td>
                  <td>
                    <span className="badge">{r.status}</span>
                  </td>
                  <td>{money(r.amount_cents)}</td>
                  <td className="muted">{when(r.paid_at ?? r.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
