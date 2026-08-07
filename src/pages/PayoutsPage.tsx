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

type StripeTeacher = {
  user_id: string;
  display_name: string;
  stripe_payouts_enabled: boolean | null;
  stripe_charges_enabled: boolean | null;
};

/**
 * Manual (Somali bank / EVC) payouts only.
 * Stripe Connect teachers receive 80% at checkout and withdraw in Stripe themselves —
 * admin does not approve or send those payouts.
 */
export function PayoutsPage() {
  const [rows, setRows] = useState<Payout[]>([]);
  const [stripeTeachers, setStripeTeachers] = useState<StripeTeacher[]>([]);
  const [teacherId, setTeacherId] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  const load = async () => {
    const [{ data }, { data: teachers }] = await Promise.all([
      supabase.from('teacher_payouts').select('*').order('period_end', { ascending: false }).limit(40),
      supabase
        .from('teacher_profiles')
        .select('user_id, display_name, stripe_payouts_enabled, stripe_charges_enabled')
        .eq('payout_mode', 'stripe_connect')
        .eq('status', 'approved')
        .limit(50),
    ]);
    setRows((data as Payout[]) ?? []);
    setStripeTeachers((teachers as StripeTeacher[]) ?? []);
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Payouts</h2>
          <p className="muted">Two different money paths — do not mix them up.</p>
        </div>
      </div>

      <div className="card">
        <h3>Stripe Connect (default)</h3>
        <p className="muted">
          When a student buys a course, <strong>80% goes to the teacher’s Stripe account</strong> and
          TaaTiko keeps <strong>20%</strong>. The teacher withdraws to their bank{' '}
          <strong>anytime in Stripe</strong> — admin does <strong>not</strong> click “pay” and does{' '}
          <strong>not</strong> control that withdrawal.
        </p>
        <p className="muted">
          Stripe-ready teachers: {stripeTeachers.length} ·{' '}
          {stripeTeachers.filter((t) => t.stripe_payouts_enabled).length} can withdraw
        </p>
        {stripeTeachers.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Teacher</th>
                <th>Charges</th>
                <th>Payouts (withdraw)</th>
              </tr>
            </thead>
            <tbody>
              {stripeTeachers.slice(0, 15).map((t) => (
                <tr key={t.user_id}>
                  <td>
                    {t.display_name}
                    <div className="muted">{shortId(t.user_id)}</div>
                  </td>
                  <td>
                    <span className="badge">
                      {t.stripe_charges_enabled ? 'ready' : 'pending'}
                    </span>
                  </td>
                  <td>
                    <span className="badge">
                      {t.stripe_payouts_enabled ? 'self-withdraw OK' : 'pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="muted">No Stripe Connect teachers yet.</p>
        )}
      </div>

      <div className="card">
        <h3>Manual payouts only (non-Stripe)</h3>
        <p className="muted">
          Use this only for teachers on <code>manual_somali</code> (EVC / Zaad / Sahal / bank) who
          cannot use Stripe. Admin calculates a period and marks paid after sending money.
        </p>
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
          Calculate manual payout
        </button>
      </div>

      {rows.map((p) => (
        <div className="card" key={p.id}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div>
              <strong>{money(p.payout_amount_cents)}</strong>
              <div className="muted">
                {p.period_start} → {p.period_end} · {p.payout_method} · ***
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
                const ref = prompt('Transaction reference');
                if (!ref?.trim()) return;
                if (!confirm('Confirm manual payout marked paid?')) return;
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
              Mark manual paid
            </button>
          ) : (
            <div className="muted">Ref: {p.transaction_reference}</div>
          )}
        </div>
      ))}
    </div>
  );
}
