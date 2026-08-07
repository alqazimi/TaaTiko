import { useEffect, useMemo, useState } from 'react';
import { shortId, when } from '../lib/format';
import { supabase } from '../lib/supabase';

type TeacherRow = {
  user_id: string;
  display_name: string;
  status: string;
  subjects: string[] | null;
  students_count: number | null;
  average_rating: number | null;
  stripe_onboarding_complete: boolean | null;
  payout_mode: string | null;
  approved_at: string | null;
  profile?: { username: string } | null;
};

export function TeachersListPage() {
  const [rows, setRows] = useState<TeacherRow[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('teacher_profiles')
        .select(
          'user_id, display_name, status, subjects, students_count, average_rating, stripe_onboarding_complete, payout_mode, approved_at',
        )
        .order('approved_at', { ascending: false })
        .limit(200);

      const list = (data as TeacherRow[]) ?? [];
      const ids = list.map((t) => t.user_id);
      if (ids.length) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username')
          .in('id', ids);
        const map = new Map((profiles ?? []).map((p) => [p.id as string, p.username as string]));
        setRows(
          list.map((t) => ({
            ...t,
            profile: { username: map.get(t.user_id) ?? '' },
          })),
        );
      } else {
        setRows([]);
      }
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter(
      (t) =>
        t.display_name.toLowerCase().includes(needle) ||
        (t.profile?.username ?? '').toLowerCase().includes(needle) ||
        t.user_id.toLowerCase().includes(needle),
    );
  }, [q, rows]);

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Teachers</h2>
          <p className="muted">{loading ? 'Loading…' : `${filtered.length} teacher profiles`}</p>
        </div>
        <input
          style={{ maxWidth: 260, margin: 0 }}
          placeholder="Search teacher"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Teacher</th>
              <th>Status</th>
              <th>Students</th>
              <th>Rating</th>
              <th>How paid</th>
              <th>Stripe</th>
              <th>Approved</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.user_id}>
                <td>
                  <strong>{t.display_name}</strong>
                  <div className="muted">
                    @{t.profile?.username || shortId(t.user_id)} ·{' '}
                    {(t.subjects ?? []).slice(0, 3).join(', ') || '—'}
                  </div>
                </td>
                <td>
                  <span className="badge">{t.status}</span>
                </td>
                <td>{t.students_count ?? 0}</td>
                <td>{t.average_rating ? Number(t.average_rating).toFixed(1) : '—'}</td>
                <td>
                  {t.payout_mode === 'stripe_connect'
                    ? 'Self-withdraw (Stripe)'
                    : t.payout_mode === 'manual_somali'
                      ? 'Manual (admin)'
                      : (t.payout_mode ?? '—')}
                </td>
                <td>{t.stripe_onboarding_complete ? 'Ready' : 'Incomplete'}</td>
                <td className="muted">{when(t.approved_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
