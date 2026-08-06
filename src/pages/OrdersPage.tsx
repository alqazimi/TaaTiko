import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type Order = {
  id: string;
  course_id: string;
  student_id: string;
  teacher_id: string;
  status: string;
  amount_cents: number;
  platform_commission_cents: number;
  teacher_share_cents: number;
  paid_at: string | null;
};

export function OrdersPage() {
  const [rows, setRows] = useState<Order[]>([]);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from('course_purchases')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      setRows((data as Order[]) ?? []);
    })();
  }, []);

  return (
    <div>
      <h2>Orders & refunds</h2>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Status</th>
              <th>Amount</th>
              <th>Platform 20%</th>
              <th>Teacher 80%</th>
              <th>Paid</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id}>
                <td><span className="badge">{o.status}</span></td>
                <td>${(o.amount_cents / 100).toFixed(2)}</td>
                <td>${(o.platform_commission_cents / 100).toFixed(2)}</td>
                <td>${(o.teacher_share_cents / 100).toFixed(2)}</td>
                <td className="muted">{o.paid_at ? new Date(o.paid_at).toLocaleString() : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
