export function money(cents: number | null | undefined) {
  return `$${((cents ?? 0) / 100).toFixed(2)}`;
}

export function shortId(id: string | null | undefined) {
  if (!id) return '—';
  return `${id.slice(0, 8)}…`;
}

export function when(iso: string | null | undefined) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}
