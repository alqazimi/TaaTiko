import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type Log = {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  created_at: string;
  actor_id: string | null;
};

export function AuditPage() {
  const [rows, setRows] = useState<Log[]>([]);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (data?.length) {
        setRows(data as Log[]);
        return;
      }
      const { data: learn } = await supabase
        .from('learn_admin_actions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      setRows(
        ((learn ?? []) as Record<string, unknown>[]).map((r) => ({
          id: String(r.id),
          action: String(r.action),
          entity_type: String(r.entity_type),
          entity_id: (r.entity_id as string) ?? null,
          created_at: String(r.created_at),
          actor_id: (r.actor_id as string) ?? null,
        })),
      );
    })();
  }, []);

  return (
    <div>
      <h2>Audit logs</h2>
      <div className="card">
        <div className="table-scroll">
<table>
          <thead>
            <tr>
              <th>When</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Actor</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="muted">{new Date(r.created_at).toLocaleString()}</td>
                <td>{r.action}</td>
                <td>{r.entity_type} {r.entity_id?.slice(0, 8)}</td>
                <td className="muted">{r.actor_id?.slice(0, 8) ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
