import { useEffect, useState } from 'react';
import { money, when } from '../lib/format';
import { supabase } from '../lib/supabase';

type CourseRow = {
  id: string;
  title: string;
  price_cents: number;
  teacher_id: string;
  status: string;
  short_description: string | null;
  lessons_count: number | null;
  updated_at: string;
  teacher?: { display_name: string } | null;
};

export function CourseReviewPage() {
  const [rows, setRows] = useState<CourseRow[]>([]);

  const load = async () => {
    const { data } = await supabase
      .from('courses')
      .select(
        'id, title, price_cents, teacher_id, status, short_description, lessons_count, updated_at, teacher:teacher_profiles!courses_teacher_id_fkey(display_name)',
      )
      .eq('status', 'under_review')
      .order('updated_at', { ascending: true });
    setRows(
      ((data ?? []) as unknown as Array<Omit<CourseRow, 'teacher'> & { teacher: unknown }>).map((row) => ({
        ...row,
        teacher: Array.isArray(row.teacher) ? row.teacher[0] ?? null : (row.teacher as CourseRow['teacher']),
      })),
    );
  };

  useEffect(() => {
    void load();
  }, []);

  const review = async (id: string, status: string) => {
    if (!confirm(`Set course to ${status}?`)) return;
    const { error } = await supabase.rpc('review_course', {
      p_course_id: id,
      p_status: status,
      p_notes: null,
    });
    if (error) alert(error.message);
    else void load();
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Course review queue</h2>
          <p className="muted">{rows.length} waiting for decision</p>
        </div>
      </div>
      {rows.length === 0 ? <p className="muted">Queue empty.</p> : null}
      {rows.map((c) => (
        <div className="card" key={c.id}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div>
              <strong>{c.title}</strong>
              <div className="muted">
                {c.teacher?.display_name ?? 'Teacher'} · {money(c.price_cents)} ·{' '}
                {c.lessons_count ?? 0} lessons · updated {when(c.updated_at)}
              </div>
              {c.short_description ? <p className="muted">{c.short_description}</p> : null}
            </div>
            <span className="badge">{c.status}</span>
          </div>
          <div className="row" style={{ marginTop: 10 }}>
            <button className="btn" onClick={() => void review(c.id, 'published')}>
              Publish
            </button>
            <button className="btn ghost" onClick={() => void review(c.id, 'changes_requested')}>
              Request changes
            </button>
            <button className="btn danger" onClick={() => void review(c.id, 'rejected')}>
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
