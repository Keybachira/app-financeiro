import { db } from '../db/client';

export function getSetting(key: string): string | null {
  const row = db.getFirstSync<{ value: string }>('SELECT value FROM settings WHERE key = ?', [key]);
  return row?.value ?? null;
}

export function setSetting(key: string, value: string): void {
  db.runSync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value',
    [key, value]
  );
}

export function removeSetting(key: string): void {
  db.runSync('DELETE FROM settings WHERE key = ?', [key]);
}

export function getAllSettings(): Record<string, string> {
  const rows = db.getAllSync<{ key: string; value: string }>('SELECT key, value FROM settings ORDER BY key');
  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}
