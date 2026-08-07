import { useEffect, useState } from 'react';
import { shortId, when } from '../lib/format';
import { supabase } from '../lib/supabase';

type VideoRow = {
  id: string;
  caption: string | null;
  status: string;
  views_count: number | null;
  likes_count: number | null;
  creator_id: string;
  created_at: string;
  deleted_at: string | null;
  creator?: { username: string; display_name: string | null } | null;
};

function unwrapOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export function VideosPage() {
  const [rows, setRows] = useState<VideoRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const { data } = await supabase
        .from('videos')
        .select(
          'id, caption, status, views_count, likes_count, creator_id, created_at, deleted_at, creator:profiles!videos_creator_id_fkey(username, display_name)',
        )
        .order('created_at', { ascending: false })
        .limit(100);
      const normalized = ((data ?? []) as unknown as Array<Omit<VideoRow, 'creator'> & { creator: unknown }>).map(
        (row) => ({
          ...row,
          creator: unwrapOne(row.creator as VideoRow['creator'] | VideoRow['creator'][]),
        }),
      );
      setRows(normalized);
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      <div className="page-head">
        <div>
          <h2>Videos</h2>
          <p className="muted">{loading ? 'Loading…' : `${rows.length} recent uploads`}</p>
        </div>
      </div>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Caption</th>
              <th>Creator</th>
              <th>Status</th>
              <th>Views</th>
              <th>Likes</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((v) => (
              <tr key={v.id}>
                <td>
                  <strong>{(v.caption || 'Untitled').slice(0, 60)}</strong>
                  <div className="muted">{shortId(v.id)}</div>
                </td>
                <td>@{v.creator?.username ?? shortId(v.creator_id)}</td>
                <td>
                  <span className="badge">{v.deleted_at ? 'deleted' : v.status}</span>
                </td>
                <td>{v.views_count ?? 0}</td>
                <td>{v.likes_count ?? 0}</td>
                <td className="muted">{when(v.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
