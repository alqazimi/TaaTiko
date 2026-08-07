import { useEffect, useMemo, useState } from 'react';
import { money, shortId, when } from '../lib/format';
import { supabase } from '../lib/supabase';

type CourseRow = {
  id: string;
  title: string;
  status: string;
  price_cents: number;
  students_count: number | null;
  lessons_count: number | null;
  teacher_id: string;
  published_at: string | null;
  updated_at: string;
  teacher?: { display_name: string } | null;
};

const STATUSES = [
  'all',
  'published',
  'under_review',
  'draft',
  'changes_requested',
  'approved',
  'rejected',
  'suspended',
  'archived',
] as const;

export function CoursesCatalogPage() {
  const [rows, setRows] = useState<CourseRow[]>([]);
  const [status, setStatus] = useState<(typeof STATUSES)[number]>('all');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    let query = supabase
      .from('courses')
      .select(
        'id, title, status, price_cents, students_count, lessons_count, teacher_id, published_at, updated_at, teacher:teacher_profiles!courses_teacher_id_fkey(display_name)',
      )
      .order('updated_at', { ascending: false })
      .limit(150);
    if (status !== 'all') query = query.eq('status', status);
    const { data } = await query;
    const normalized = ((data ?? []) as unknown as Array<Omit<CourseRow, 'teacher'> & { teacher: unknown }>).map(
      (row) => ({
        ...row,
        teacher: Array.isArray(row.teacher) ? row.teacher[0] ?? null : (row.teacher as CourseRow['teacher']),
      }),
    );
    setRows(normalized);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, [status]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter(
      (c) =>
        c.title.toLowerCase().includes(needle) ||
        (c.teacher?.display_name ?? '').toLowerCase().includes(needle),
    );
  }, [q, rows]);

  const publish = async (id: string, next: string) => {
    if (!confirm(`Set course to ${next}?`)) return;
    const { error } = await supabase.rpc('review_course', {
      p_course_id: id,
      p_status: next,
      p_notes: null,
    });
    if (error) alert(error.message);
    else void load();
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Courses</h2>
          <p className="muted">
            {loading ? 'Loading…' : `${filtered.length} courses`} · active = published
          </p>
        </div>
        <input
          style={{ maxWidth: 240, margin: 0 }}
          placeholder="Search title / teacher"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="row" style={{ marginBottom: 12 }}>
        {STATUSES.map((s) => (
          <button
            key={s}
            className={`btn ghost${status === s ? ' active-filter' : ''}`}
            onClick={() => setStatus(s)}
          >
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="table-scroll">
<table>
          <thead>
            <tr>
              <th>Course</th>
              <th>Teacher</th>
              <th>Status</th>
              <th>Price</th>
              <th>Students</th>
              <th>Updated</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id}>
                <td>
                  <strong>{c.title}</strong>
                  <div className="muted">{c.lessons_count ?? 0} lessons</div>
                </td>
                <td>
                  {c.teacher?.display_name ?? shortId(c.teacher_id)}
                </td>
                <td>
                  <span className="badge">{c.status}</span>
                </td>
                <td>{money(c.price_cents)}</td>
                <td>{c.students_count ?? 0}</td>
                <td className="muted">{when(c.updated_at)}</td>
                <td>
                  {c.status === 'under_review' ? (
                    <div className="row">
                      <button className="btn" onClick={() => void publish(c.id, 'published')}>
                        Publish
                      </button>
                      <button
                        className="btn danger"
                        onClick={() => void publish(c.id, 'rejected')}
                      >
                        Reject
                      </button>
                    </div>
                  ) : c.status === 'published' ? (
                    <button
                      className="btn ghost"
                      onClick={() => void publish(c.id, 'suspended')}
                    >
                      Suspend
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
