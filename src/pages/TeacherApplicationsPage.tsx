import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type AppRow = {
  id: string;
  display_name: string;
  legal_name: string;
  email: string;
  city: string;
  country: string;
  payout_method: string;
  payout_account_name: string;
  payout_account_number: string;
  status: string;
};

export function TeacherApplicationsPage() {
  const [rows, setRows] = useState<AppRow[]>([]);

  const load = async () => {
    const { data } = await supabase
      .from('teacher_applications')
      .select('*')
      .in('status', ['pending', 'information_required', 'more_info_required'])
      .order('created_at', { ascending: true });
    setRows((data as AppRow[]) ?? []);
  };

  useEffect(() => {
    void load();
  }, []);

  const review = async (id: string, status: string) => {
    if (!confirm(`Mark application as ${status}?`)) return;
    const { error } = await supabase.rpc('review_teacher_application', {
      p_application_id: id,
      p_status: status,
      p_notes: null,
    });
    if (error) alert(error.message);
    else void load();
  };

  return (
    <div>
      <h2>Teacher applications</h2>
      {rows.length === 0 ? <p className="muted">No pending applications.</p> : null}
      {rows.map((app) => (
        <div className="card" key={app.id}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div>
              <strong>{app.display_name}</strong>
              <div className="muted">
                {app.legal_name} · {app.email} · {app.city}, {app.country}
              </div>
              <div className="muted">
                Payout: {app.payout_method} · {app.payout_account_name} · {app.payout_account_number}
              </div>
            </div>
            <span className="badge">{app.status}</span>
          </div>
          <div className="row" style={{ marginTop: 10 }}>
            <button className="btn" onClick={() => void review(app.id, 'approved')}>Approve</button>
            <button className="btn ghost" onClick={() => void review(app.id, 'information_required')}>
              More info
            </button>
            <button className="btn danger" onClick={() => void review(app.id, 'rejected')}>Reject</button>
          </div>
        </div>
      ))}
    </div>
  );
}
