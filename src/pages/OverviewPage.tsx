import { useEffect, useState } from 'react';
import { supabase, type AdminRole } from '../lib/supabase';

export function OverviewPage({ roles }: { roles: AdminRole[] }) {
  const [stats, setStats] = useState({
    pendingTeachers: 0,
    coursesInReview: 0,
    paidOrders: 0,
    pendingPayouts: 0,
  });

  useEffect(() => {
    void (async () => {
      const [t, c, o, p] = await Promise.all([
        supabase.from('teacher_applications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('courses').select('id', { count: 'exact', head: true }).eq('status', 'under_review'),
        supabase.from('course_purchases').select('id', { count: 'exact', head: true }).eq('status', 'paid'),
        supabase.from('teacher_payouts').select('id', { count: 'exact', head: true }).in('status', ['pending', 'approved']),
      ]);
      setStats({
        pendingTeachers: t.count ?? 0,
        coursesInReview: c.count ?? 0,
        paidOrders: o.count ?? 0,
        pendingPayouts: p.count ?? 0,
      });
    })();
  }, []);

  return (
    <div>
      <h2>Overview</h2>
      <p className="muted">Roles: {roles.join(', ')} · Live and Shop removed from platform.</p>
      <div className="grid" style={{ marginTop: 16 }}>
        <div className="stat"><strong>{stats.pendingTeachers}</strong>Pending teachers</div>
        <div className="stat"><strong>{stats.coursesInReview}</strong>Courses in review</div>
        <div className="stat"><strong>{stats.paidOrders}</strong>Paid orders</div>
        <div className="stat"><strong>{stats.pendingPayouts}</strong>Pending payouts</div>
      </div>
      <div className="card" style={{ marginTop: 16 }}>
        <h3>Revenue model</h3>
        <p className="muted">
          Platform 20% / Teacher 80% on gross. Stripe fees absorbed by platform
          (`learn_settings.fee_policy = platform_absorbs_stripe`). Earnings ledger is immutable.
        </p>
      </div>
    </div>
  );
}
