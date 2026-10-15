export type Migration = {
  version: number;
  statements: string[];
};

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    statements: [
      `CREATE TABLE IF NOT EXISTS bills (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        icon TEXT,
        amount INTEGER NOT NULL CHECK (amount > 0),
        day_of_month INTEGER NOT NULL CHECK (day_of_month BETWEEN 1 AND 31),
        remind_days_before INTEGER NOT NULL DEFAULT 1,
        category TEXT NOT NULL,
        active INTEGER NOT NULL DEFAULT 1
      )`,
      `CREATE TABLE IF NOT EXISTS movements (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL CHECK (type IN ('income','expense')),
        amount INTEGER NOT NULL CHECK (amount > 0),
        category TEXT NOT NULL,
        date TEXT NOT NULL,
        note TEXT,
        bill_id TEXT REFERENCES bills(id) ON DELETE SET NULL,
        project_payment_id TEXT
      )`,
      `CREATE INDEX IF NOT EXISTS idx_mov_date ON movements(date)`,
      `CREATE TABLE IF NOT EXISTS goals (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        target INTEGER NOT NULL CHECK (target > 0),
        deadline TEXT,
        created_at TEXT NOT NULL,
        completed_at TEXT,
        archived_at TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS goal_ops (
        id TEXT PRIMARY KEY,
        goal_id TEXT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
        kind TEXT NOT NULL CHECK (kind IN ('deposit','withdraw')),
        amount INTEGER NOT NULL CHECK (amount > 0),
        date TEXT NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS idx_goal_ops_goal ON goal_ops(goal_id)`,
      `CREATE TABLE IF NOT EXISTS debts (
        id TEXT PRIMARY KEY,
        kind TEXT NOT NULL CHECK (kind IN ('owe','owed')),
        party TEXT NOT NULL,
        total INTEGER NOT NULL CHECK (total > 0),
        loan_date TEXT NOT NULL,
        due_date TEXT,
        note TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS debt_payments (
        id TEXT PRIMARY KEY,
        debt_id TEXT NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
        amount INTEGER NOT NULL CHECK (amount > 0),
        date TEXT NOT NULL,
        movement_id TEXT REFERENCES movements(id) ON DELETE SET NULL
      )`,
      `CREATE INDEX IF NOT EXISTS idx_debt_pay_debt ON debt_payments(debt_id)`,
      `CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        client TEXT,
        total INTEGER NOT NULL CHECK (total > 0),
        due_date TEXT,
        created_at TEXT NOT NULL,
        delivered_at TEXT,
        note TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS project_payments (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        amount INTEGER NOT NULL CHECK (amount > 0),
        date TEXT NOT NULL,
        movement_id TEXT REFERENCES movements(id) ON DELETE SET NULL
      )`,
      `CREATE INDEX IF NOT EXISTS idx_proj_pay_proj ON project_payments(project_id)`,
      `CREATE TABLE IF NOT EXISTS bill_payments (
        id TEXT PRIMARY KEY,
        bill_id TEXT NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
        month TEXT NOT NULL,
        paid_on TEXT NOT NULL,
        amount INTEGER NOT NULL,
        movement_id TEXT REFERENCES movements(id) ON DELETE SET NULL,
        UNIQUE (bill_id, month)
      )`,
      `CREATE TABLE IF NOT EXISTS category_hints (
        keyword TEXT PRIMARY KEY,
        category TEXT NOT NULL,
        uses INTEGER NOT NULL DEFAULT 1,
        last_used TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )`,
    ],
  },
  {
    version: 2,
    statements: [
      // `origin` distingue movimento escrito pelo utilizador de movimento gerado
      // pelo sistema (conta fixa, dívida, projeto, salário). Sem isto, as notas
      // automáticas ("Salário", "Pagamento · Carlos") entravam em category_hints
      // e passavam a sugerir categorias ao utilizador.
      // SQLite não permite adicionar CHECK via ALTER TABLE, por isso o domínio
      // dos valores é garantido em `src/repos/movements.ts`.
      `ALTER TABLE movements ADD COLUMN origin TEXT NOT NULL DEFAULT 'manual'`,
      // Backfill do que é possível reconstruir a partir das ligações existentes.
      `UPDATE movements SET origin = 'bill'
        WHERE id IN (SELECT movement_id FROM bill_payments WHERE movement_id IS NOT NULL)`,
      `UPDATE movements SET origin = 'debt'
        WHERE id IN (SELECT movement_id FROM debt_payments WHERE movement_id IS NOT NULL)`,
      `UPDATE movements SET origin = 'project'
        WHERE id IN (SELECT movement_id FROM project_payments WHERE movement_id IS NOT NULL)`,
      // O salário automático é o único movimento sem ligação: é reconhecido
      // pela categoria e pelo tipo (receita).
      `UPDATE movements SET origin = 'salary'
        WHERE category = 'Salário' AND type = 'income'`,
      `CREATE INDEX IF NOT EXISTS idx_mov_origin ON movements(origin)`,
    ],
  },
];

export interface MigrationExecutor {
  execSync(sql: string): void;
  getFirstSync<T>(sql: string): T | null;
}

export function getSchemaVersion(db: MigrationExecutor): number {
  const row = db.getFirstSync<{ user_version: number }>('PRAGMA user_version');
  return row?.user_version ?? 0;
}

export function applyMigrations(db: MigrationExecutor): void {
  const currentVersion = getSchemaVersion(db);

  for (const migration of MIGRATIONS) {
    if (migration.version <= currentVersion) {
      continue;
    }

    applyMigration(db, migration);
  }
}

function applyMigration(db: MigrationExecutor, migration: Migration): void {
  db.execSync('BEGIN');
  try {
    for (const statement of migration.statements) {
      db.execSync(statement);
    }
    db.execSync(`PRAGMA user_version = ${migration.version}`);
    db.execSync('COMMIT');
  } catch (error) {
    db.execSync('ROLLBACK');
    throw error;
  }
}
