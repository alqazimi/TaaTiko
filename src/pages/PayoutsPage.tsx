import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type Payout = {
  id: string;
  teacher_id: string;
  period_start: string;
  period_end: string;
  payout_amount_cents: number;
  status: string;
  payout_method: string | null;
  payout_account_number: string | null;
  transaction_reference: string | null;
};

export function PayoutsPage() {
  const [rows, setRows] = useState<Payout[]>([]);
  const [teacherId, setTeacherId] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  const load = async () => {
    const { data } = await supabase
      .from('teacher_payouts')
      .select('*')
      .order('period_end', { ascending: false })
      .limit(40);
    setRows((data as Payout[]) ?? []);
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div>
      <h2>Monthly payouts</h2>
      <div className="card">
        <p className="muted">Close period → calculate → pay via EVC/Zaad/Sahal/bank → enter reference.</p>
        <label className="muted">Teacher user id</label>
        <input value={teacherId} onChange={(e) => setTeacherId(e.target.value)} />
        <label className="muted">Period start (YYYY-MM-DD)</label>
        <input value={start} onChange={(e) => setStart(e.target.value)} />
        <label className="muted">Period end</label>
        <input value={end} onChange={(e) => setEnd(e.target.value)} />
        <button
          className="btn"
          onClick={async () => {
            const { error } = await supabase.rpc('create_teacher_payout_statement', {
              p_teacher_id: teacherId,
              p_period_start: start,
              p_period_end: end,
            });
            if (error) alert(error.message);
            else {
              alert('Statement created');
              void load();
            }
          }}
        >
          Calculate payout
        </button>
      </div>

      {rows.map((p) => (
        <div className="card" key={p.id}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div>
              <strong>${(p.payout_amount_cents / 100).toFixed(2)}</strong>
              <div className="muted">
                {p.period_start} → {p.period_end} · {p.payout_method} · ***
                {(p.payout_account_number ?? '').slice(-4)}
              </div>
            </div>
            <span className="badge">{p.status}</span>
          </div>
          {p.status !== 'paid' ? (
            <button
              className="btn"
              style={{ marginTop: 10 }}
              onClick={async () => {
                const ref = prompt('Transaction reference');
                if (!ref?.trim()) return;
                if (!confirm('Confirm payout marked paid?')) return;
                const { error } = await supabase.rpc('mark_teacher_payout_paid', {
                  p_payout_id: p.id,
                  p_transaction_reference: ref.trim(),
                  p_payment_date: new Date().toISOString().slice(0, 10),
                  p_notes: null,
                });
                if (error) alert(error.message);
                else void load();
              }}
            >
              Mark paid
            </button>
          ) : (
            <div className="muted">Ref: {p.transaction_reference}</div>
          )}
        </div>
      ))}
    </div>
  );
}
