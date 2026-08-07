import { useEffect, useState } from 'react';
import { shortId, when } from '../lib/format';
import { supabase } from '../lib/supabase';

type Dispute = {
  id: string;
  purchase_id: string;
  stripe_dispute_id: string | null;
  status: string;
  amount_cents: number | null;
  reason: string | null;
  created_at: string;
};

export function DisputesPage() {
  const [rows, setRows] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('payment_disputes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) console.warn(error.message);
      setRows((data as Dispute[]) ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Payment disputes</h2>
          <p className="muted">{loading ? 'Loading…' : `${rows.length} disputes`}</p>
        </div>
      </div>
      <div className="card">
        {rows.length === 0 ? (
          <p className="muted">No disputes recorded.</p>
        ) : (
          <div className="table-scroll">
<table>
            <thead>
              <tr>
                <th>Status</th>
                <th>Purchase</th>
                <th>Stripe</th>
                <th>Amount</th>
                <th>Reason</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.id}>
                  <td>
                    <span className="badge">{d.status}</span>
                  </td>
                  <td>{shortId(d.purchase_id)}</td>
                  <td className="muted">{d.stripe_dispute_id ?? '—'}</td>
                  <td>
                    {d.amount_cents != null ? `$${(d.amount_cents / 100).toFixed(2)}` : '—'}
                  </td>
                  <td>{d.reason ?? '—'}</td>
                  <td className="muted">{when(d.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}
