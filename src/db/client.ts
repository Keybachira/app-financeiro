import * as SQLite from 'expo-sqlite';

import { applyMigrations } from './migrations';

export const db = SQLite.openDatabaseSync('financas.db');

db.execSync('PRAGMA foreign_keys = ON');

export function ensureDatabase(): void {
  applyMigrations(db);
}
