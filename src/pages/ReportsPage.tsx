import { useEffect, useState } from 'react';
import { shortId, when } from '../lib/format';
import { supabase } from '../lib/supabase';

type ReportRow = {
  id: string;
  reason: string;
  description: string | null;
  status: string;
  reporter_id: string;
  reported_user_id: string | null;
  video_id: string | null;
  comment_id: string | null;
  created_at: string;
};

export function ReportsPage() {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) {
      console.warn(error.message);
    }
    setRows((data as ReportRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('reports').update({ status }).eq('id', id);
    if (error) alert(error.message);
    else void load();
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Reports</h2>
          <p className="muted">
            {loading ? 'Loading…' : `${rows.length} reports`} · apply migration
            admin_moderation_rls if empty for admins
          </p>
        </div>
      </div>
      {rows.length === 0 ? (
        <div className="card">
          <p className="muted">No reports (or RLS blocks admin read until migration is applied).</p>
        </div>
      ) : (
        rows.map((r) => (
          <div className="card" key={r.id}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <div>
                <strong>{r.reason}</strong>
                <div className="muted">{r.description || 'No details'}</div>
                <div className="muted">
                  reporter {shortId(r.reporter_id)} · user {shortId(r.reported_user_id)} · video{' '}
                  {shortId(r.video_id)} · {when(r.created_at)}
                </div>
              </div>
              <span className="badge">{r.status}</span>
            </div>
            {r.status === 'pending' || r.status === 'reviewing' ? (
              <div className="row" style={{ marginTop: 10 }}>
                <button className="btn ghost" onClick={() => void setStatus(r.id, 'reviewing')}>
                  Reviewing
                </button>
                <button className="btn" onClick={() => void setStatus(r.id, 'resolved')}>
                  Resolve
                </button>
                <button className="btn danger" onClick={() => void setStatus(r.id, 'rejected')}>
                  Reject
                </button>
              </div>
            ) : null}
          </div>
        ))
      )}
    </div>
  );
}
