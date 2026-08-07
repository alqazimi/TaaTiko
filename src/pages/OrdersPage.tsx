import { useEffect, useMemo, useState } from 'react';
import { money, shortId, when } from '../lib/format';
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
  created_at: string;
  course?: { title: string } | null;
};

export function OrdersPage() {
  const [rows, setRows] = useState<Order[]>([]);
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      let query = supabase
        .from('course_purchases')
        .select(
          'id, course_id, student_id, teacher_id, status, amount_cents, platform_commission_cents, teacher_share_cents, paid_at, created_at, course:courses(title)',
        )
        .order('created_at', { ascending: false })
        .limit(100);
      if (status !== 'all') query = query.eq('status', status);
      const { data } = await query;
      setRows(
        ((data ?? []) as unknown as Array<Omit<Order, 'course'> & { course: unknown }>).map((row) => ({
          ...row,
          course: Array.isArray(row.course) ? row.course[0] ?? null : (row.course as Order['course']),
        })),
      );
      setLoading(false);
    })();
  }, [status]);

  const totals = useMemo(() => {
    const paid = rows.filter((r) => r.status === 'paid');
    return {
      gmv: paid.reduce((s, r) => s + r.amount_cents, 0),
      platform: paid.reduce((s, r) => s + r.platform_commission_cents, 0),
      teacher: paid.reduce((s, r) => s + r.teacher_share_cents, 0),
    };
  }, [rows]);

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Orders & refunds</h2>
          <p className="muted">
            {loading ? 'Loading…' : `${rows.length} orders`} · GMV {money(totals.gmv)} · platform{' '}
            {money(totals.platform)}
          </p>
        </div>
      </div>
      <div className="row" style={{ marginBottom: 12 }}>
        {['all', 'paid', 'pending', 'refunded', 'failed', 'chargeback'].map((s) => (
          <button
            key={s}
            className={`btn ghost${status === s ? ' active-filter' : ''}`}
            onClick={() => setStatus(s)}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="card">
        <div className="table-scroll">
<table>
          <thead>
            <tr>
              <th>Course</th>
              <th>Status</th>
              <th>Amount</th>
              <th>Platform 20%</th>
              <th>Teacher 80%</th>
              <th>Student</th>
              <th>Paid</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id}>
                <td>
                  <strong>{o.course?.title ?? shortId(o.course_id)}</strong>
                </td>
                <td>
                  <span className="badge">{o.status}</span>
                </td>
                <td>{money(o.amount_cents)}</td>
                <td>{money(o.platform_commission_cents)}</td>
                <td>{money(o.teacher_share_cents)}</td>
                <td className="muted">{shortId(o.student_id)}</td>
                <td className="muted">{when(o.paid_at ?? o.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
