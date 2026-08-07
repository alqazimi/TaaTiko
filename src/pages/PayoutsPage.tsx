import { useEffect, useState } from 'react';
import { money, shortId } from '../lib/format';
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

type ManualTeacher = {
  user_id: string;
  display_name: string;
};

/**
 * Admin pays only teachers on manual_somali (EVC / Zaad / bank).
 * Stripe Connect teachers get 80% at checkout and withdraw in Stripe themselves —
 * they are not paid from this screen.
 */
export function PayoutsPage() {
  const [rows, setRows] = useState<Payout[]>([]);
  const [manualTeachers, setManualTeachers] = useState<ManualTeacher[]>([]);
  const [teacherId, setTeacherId] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    const [{ data }, { data: teachers }] = await Promise.all([
      supabase.from('teacher_payouts').select('*').order('period_end', { ascending: false }).limit(40),
      supabase
        .from('teacher_profiles')
        .select('user_id, display_name')
        .eq('payout_mode', 'manual_somali')
        .eq('status', 'approved')
        .order('display_name')
        .limit(100),
    ]);
    setRows((data as Payout[]) ?? []);
    setManualTeachers((teachers as ManualTeacher[]) ?? []);
  };

  useEffect(() => {
    void load();
  }, []);

  const createStatement = async () => {
    setError('');
    if (!teacherId || !start || !end) {
      setError('Pick a teacher and period dates.');
      return;
    }
    setBusy(true);
    const { error: rpcError } = await supabase.rpc('create_teacher_payout_statement', {
      p_teacher_id: teacherId,
      p_period_start: start,
      p_period_end: end,
    });
    setBusy(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    void load();
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Manual payouts</h2>
          <p className="muted">
            Pay teachers who use EVC / Zaad / Sahal / bank only. Stripe Connect teachers withdraw
            their own money in Stripe — admin never pays them here.
          </p>
        </div>
      </div>

      <div className="card" style={{ borderColor: 'var(--cyan)' }}>
        <h3 style={{ marginTop: 0 }}>Stripe Connect — not managed here</h3>
        <p className="muted" style={{ marginBottom: 0 }}>
          Student pays → <strong>80% to teacher Stripe</strong>, <strong>20% to TaaTiko</strong> →
          teacher withdraws anytime in the Stripe dashboard. No admin “pay” button. No queue.
        </p>
      </div>

      <div className="card">
        <h3>Create manual payout statement</h3>
        <p className="muted">
          Only <code>manual_somali</code> teachers appear below ({manualTeachers.length} available).
        </p>
        <label className="muted">Teacher</label>
        <select
          value={teacherId}
          onChange={(e) => setTeacherId(e.target.value)}
          style={{ width: '100%', marginBottom: 10 }}
        >
          <option value="">Select teacher…</option>
          {manualTeachers.map((t) => (
            <option key={t.user_id} value={t.user_id}>
              {t.display_name} ({shortId(t.user_id)})
            </option>
          ))}
        </select>
        <label className="muted">Period start (YYYY-MM-DD)</label>
        <input value={start} onChange={(e) => setStart(e.target.value)} placeholder="2026-07-01" />
        <label className="muted">Period end</label>
        <input value={end} onChange={(e) => setEnd(e.target.value)} placeholder="2026-07-31" />
        {error ? <p style={{ color: 'var(--danger)' }}>{error}</p> : null}
        <button className="btn" disabled={busy || manualTeachers.length === 0} onClick={() => void createStatement()}>
          {busy ? 'Working…' : 'Calculate manual payout'}
        </button>
        {manualTeachers.length === 0 ? (
          <p className="muted">No manual-payout teachers. Stripe teachers are excluded on purpose.</p>
        ) : null}
      </div>

      <h3 className="section-title">Manual payout statements</h3>
      {rows.length === 0 ? (
        <p className="muted">No manual payout statements yet.</p>
      ) : (
        rows.map((p) => (
          <div className="card" key={p.id}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <div>
                <strong>{money(p.payout_amount_cents)}</strong>
                <div className="muted">
                  {p.period_start} → {p.period_end} · {p.payout_method ?? 'manual'} · ***
                  {(p.payout_account_number ?? '').slice(-4)} · teacher {shortId(p.teacher_id)}
                </div>
              </div>
              <span className="badge">{p.status}</span>
            </div>
            {p.status !== 'paid' ? (
              <button
                className="btn"
                style={{ marginTop: 10 }}
                onClick={async () => {
                  const ref = prompt('Transaction reference (EVC / bank ref)');
                  if (!ref?.trim()) return;
                  if (!confirm('Confirm you already sent this money, then mark paid?')) return;
                  const { error: payError } = await supabase.rpc('mark_teacher_payout_paid', {
                    p_payout_id: p.id,
                    p_transaction_reference: ref.trim(),
                    p_payment_date: new Date().toISOString().slice(0, 10),
                    p_notes: null,
                  });
                  if (payError) alert(payError.message);
                  else void load();
                }}
              >
                Mark manual paid
              </button>
            ) : (
              <div className="muted">Ref: {p.transaction_reference}</div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
