import { useEffect, useMemo, useState } from 'react';
import { when } from '../lib/format';
import { supabase } from '../lib/supabase';

type UserRow = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  is_admin: boolean | null;
  is_verified: boolean | null;
  followers_count: number | null;
  videos_count: number | null;
  created_at: string;
};

export function UsersPage() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('profiles')
        .select(
          'id, username, display_name, avatar_url, is_admin, is_verified, followers_count, videos_count, created_at',
        )
        .order('created_at', { ascending: false })
        .limit(200);
      setRows((data as UserRow[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter(
      (u) =>
        u.username.toLowerCase().includes(needle) ||
        (u.display_name ?? '').toLowerCase().includes(needle) ||
        u.id.toLowerCase().includes(needle),
    );
  }, [q, rows]);

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Users</h2>
          <p className="muted">{loading ? 'Loading…' : `${filtered.length} profiles`}</p>
        </div>
        <input
          style={{ maxWidth: 280, margin: 0 }}
          placeholder="Search username, name, id"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Followers</th>
              <th>Videos</th>
              <th>Flags</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id}>
                <td>
                  <strong>{u.display_name || u.username}</strong>
                  <div className="muted">@{u.username}</div>
                </td>
                <td>{u.followers_count ?? 0}</td>
                <td>{u.videos_count ?? 0}</td>
                <td>
                  {u.is_admin ? <span className="badge">admin</span> : null}{' '}
                  {u.is_verified ? <span className="badge">verified</span> : null}
                </td>
                <td className="muted">{when(u.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
