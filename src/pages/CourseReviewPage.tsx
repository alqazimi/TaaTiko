import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type CourseRow = {
  id: string;
  title: string;
  price_cents: number;
  teacher_id: string;
  status: string;
};

export function CourseReviewPage() {
  const [rows, setRows] = useState<CourseRow[]>([]);

  const load = async () => {
    const { data } = await supabase
      .from('courses')
      .select('id, title, price_cents, teacher_id, status')
      .eq('status', 'under_review')
      .order('updated_at', { ascending: true });
    setRows((data as CourseRow[]) ?? []);
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
      <h2>Course review queue</h2>
      {rows.length === 0 ? <p className="muted">Queue empty.</p> : null}
      {rows.map((c) => (
        <div className="card" key={c.id}>
          <strong>{c.title}</strong>
          <div className="muted">${(c.price_cents / 100).toFixed(2)} · teacher {c.teacher_id.slice(0, 8)}…</div>
          <div className="row" style={{ marginTop: 10 }}>
            <button className="btn" onClick={() => void review(c.id, 'published')}>Publish</button>
            <button className="btn ghost" onClick={() => void review(c.id, 'changes_requested')}>
              Request changes
            </button>
            <button className="btn danger" onClick={() => void review(c.id, 'rejected')}>Reject</button>
          </div>
        </div>
      ))}
    </div>
  );
}
