import { DatabaseSync } from 'node:sqlite';

import { MIGRATIONS, applyMigrations, getSchemaVersion } from '../src/db/migrations.ts';

let passed = 0;
let failed = 0;

function check(name, condition) {
  if (condition) {
    passed += 1;
    console.log(`  ok  ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL  ${name}`);
  }
}

function expectThrow(name, fn) {
  try {
    fn();
    failed += 1;
    console.error(`FAIL  ${name} (nao lancou erro)`);
  } catch {
    passed += 1;
    console.log(`  ok  ${name}`);
  }
}

const EXPECTED_TABLES = [
  'movements',
  'goals',
  'goal_ops',
  'debts',
  'debt_payments',
  'projects',
  'project_payments',
  'bills',
  'bill_payments',
  'category_hints',
  'settings',
];

function createDatabase() {
  const database = new DatabaseSync(':memory:');
  database.exec('PRAGMA foreign_keys = ON');
  return database;
}

function createExecutor(database) {
  return {
    execSync: (sql) => database.exec(sql),
    getFirstSync: (sql) => database.prepare(sql).get(),
  };
}

function tableNames(database) {
  const rows = database.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'").all();
  return rows.map((row) => name(row));
}

function name(row) {
  return row.name;
}

function scalar(database, sql, ...params) {
  const row = database.prepare(sql).get(...params);
  return row === undefined ? undefined : Object.values(row)[0];
}

// Derivado de MIGRATIONS: as verificacoes de `user_version` acompanham a
// ultima migracao em vez de fixarem um numero.
const LATEST_VERSION = Math.max(...MIGRATIONS.map((migration) => migration.version));

console.log('migracoes: aplicacao inicial');
const db = createDatabase();
const exec = createExecutor(db);
applyMigrations(exec);

check(`user_version fica ${LATEST_VERSION}`, getSchemaVersion(exec) === LATEST_VERSION);
const tables = tableNames(db);
for (const table of EXPECTED_TABLES) {
  check(`tabela ${table} existe`, tables.includes(table));
}
check('foreign_keys esta ON', db.prepare('PRAGMA foreign_keys').get().foreign_keys === 1);

console.log('movements.origin: coluna, backfill e valor por omissao');
const movementColumns = db.prepare('PRAGMA table_info(movements)').all().map((row) => name(row));
check('coluna origin existe', movementColumns.includes('origin'));
{
  const dbOrigin = createDatabase();
  const execOrigin = createExecutor(dbOrigin);

  // O backfill da v2 só toca em linhas ja existentes: aplica-se primeiro a v1,
  // semeia-se uma base "antiga", e só depois se corre a v2.
  const held = MIGRATIONS.splice(1, MIGRATIONS.length - 1);
  applyMigrations(execOrigin);
  MIGRATIONS.push(...held);

  dbOrigin.exec(
    `INSERT INTO bills (id, name, amount, day_of_month, category) VALUES ('ob1', 'Luz', 3000, 10, 'Casa')`
  );
  dbOrigin.exec(
    `INSERT INTO movements (id, type, amount, category, date, note, bill_id) VALUES ('om1', 'expense', 3000, 'Casa', '2026-10-10', 'Luz', 'ob1')`
  );
  dbOrigin.exec(
    `INSERT INTO bill_payments (id, bill_id, month, paid_on, amount, movement_id) VALUES ('obp1', 'ob1', '2026-10', '2026-10-10', 3000, 'om1')`
  );
  dbOrigin.exec(
    `INSERT INTO movements (id, type, amount, category, date, note) VALUES ('om2', 'income', 150000, 'Salário', '2026-10-25', 'Salário')`
  );
  dbOrigin.exec(
    `INSERT INTO movements (id, type, amount, category, date, note) VALUES ('om3', 'expense', 500, 'Alimentação', '2026-10-26', 'cafe')`
  );

  applyMigrations(execOrigin);
  check('v2 aplicada sobre base existente', getSchemaVersion(execOrigin) === LATEST_VERSION);

  const originOf = (id) => scalar(dbOrigin, 'SELECT origin FROM movements WHERE id = ?', id);
  check('pagamento de conta reconhecido pelo backfill', originOf('om1') === 'bill');
  check('salario reconhecido pelo backfill', originOf('om2') === 'salary');
  check('movimento do utilizador fica manual', originOf('om3') === 'manual');
  check(
    'indice de origin existe',
    dbOrigin
      .prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND name = 'idx_mov_origin'")
      .get() !== undefined
  );
}

console.log('migracoes: idempotencia');
applyMigrations(exec);
check(`user_version continua ${LATEST_VERSION}`, getSchemaVersion(exec) === LATEST_VERSION);

console.log('registo de movimento e integridade referencial');
db.exec(
  `INSERT INTO bills (id, name, amount, day_of_month, category) VALUES ('b1', 'Agua', 5000, 10, 'Casa')`
);
db.exec(
  `INSERT INTO movements (id, type, amount, category, date, note, bill_id) VALUES ('m1', 'expense', 5000, 'Casa', '2026-10-10', 'agua', 'b1')`
);
db.exec(
  `INSERT INTO bill_payments (id, bill_id, month, paid_on, amount, movement_id) VALUES ('bp1', 'b1', '2026-10', '2026-10-10', 5000, 'm1')`
);
db.exec(`DELETE FROM movements WHERE id = 'm1'`);
const orphanPayment = db.prepare('SELECT movement_id FROM bill_payments WHERE id = ?').get('bp1');
check('pagamento fica sem movimento (SET NULL)', orphanPayment.movement_id === null);
db.exec(
  `INSERT INTO movements (id, type, amount, category, date) VALUES ('m2', 'expense', 5000, 'Casa', '2026-10-11')`
);
db.exec(
  `INSERT INTO bill_payments (id, bill_id, month, paid_on, amount, movement_id) VALUES ('bp2', 'b1', '2026-11', '2026-11-10', 5000, 'm2')`
);
db.exec(`DELETE FROM bills WHERE id = 'b1'`);
check('apagar conta fixa remove pagamentos (CASCADE)', db.prepare('SELECT COUNT(*) AS c FROM bill_payments').get().c === 0);
check('movimento ligado a conta fica sem bill_id (SET NULL)', db.prepare('SELECT bill_id FROM movements WHERE id = ?').get('m2').bill_id === null);

console.log('constraints: pagamento duplicado, CHECK e metas');
expectThrow('UNIQUE(bill_id, month) impede duplicado', () => {
  db.exec(`INSERT INTO bills (id, name, amount, day_of_month, category) VALUES ('b2', 'Luz', 8000, 5, 'Casa')`);
  db.exec(`INSERT INTO bill_payments (id, bill_id, month, paid_on, amount) VALUES ('bp3', 'b2', '2026-10', '2026-10-05', 8000)`);
  db.exec(`INSERT INTO bill_payments (id, bill_id, month, paid_on, amount) VALUES ('bp4', 'b2', '2026-10', '2026-10-06', 8000)`);
});
expectThrow('movimento rejeita tipo invalido', () => {
  db.exec(`INSERT INTO movements (id, type, amount, category, date) VALUES ('m3', 'transfer', 100, 'Outros', '2026-10-01')`);
});
expectThrow('movimento rejeita valor negativo', () => {
  db.exec(`INSERT INTO movements (id, type, amount, category, date) VALUES ('m4', 'expense', -100, 'Outros', '2026-10-01')`);
});
expectThrow('conta fixa rejeita dia 32', () => {
  db.exec(`INSERT INTO bills (id, name, amount, day_of_month, category) VALUES ('b3', 'Net', 9000, 32, 'Casa')`);
});
db.exec(`INSERT INTO goals (id, name, target, created_at) VALUES ('g1', 'Viagem', 120000, '2026-10-01')`);
db.exec(`INSERT INTO goal_ops (id, goal_id, kind, amount, date) VALUES ('go1', 'g1', 'deposit', 45000, '2026-10-02')`);
db.exec(`DELETE FROM goals WHERE id = 'g1'`);
check('apagar meta remove operacoes (CASCADE)', db.prepare('SELECT COUNT(*) AS c FROM goal_ops').get().c === 0);
db.exec(`INSERT INTO debts (id, kind, party, total, loan_date) VALUES ('d1', 'owe', 'Carlos', 30000, '2026-09-01')`);
db.exec(`INSERT INTO debt_payments (id, debt_id, amount, date) VALUES ('dp1', 'd1', 12000, '2026-09-15')`);
db.exec(`DELETE FROM debts WHERE id = 'd1'`);
check('apagar divida remove pagamentos (CASCADE)', db.prepare('SELECT COUNT(*) AS c FROM debt_payments').get().c === 0);
db.exec(`INSERT INTO projects (id, name, total, created_at) VALUES ('p1', 'Site', 25000, '2026-10-01')`);
db.exec(`INSERT INTO project_payments (id, project_id, amount, date) VALUES ('pp1', 'p1', 10000, '2026-10-03')`);
db.exec(`DELETE FROM projects WHERE id = 'p1'`);
check('apagar projeto remove pagamentos (CASCADE)', db.prepare('SELECT COUNT(*) AS c FROM project_payments').get().c === 0);

console.log('settings: upsert e leitura');
const runSetting = (key, value) =>
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value').run(key, value);
runSetting('monthly_limit', '300000');
runSetting('monthly_limit', '350000');
const limitRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('monthly_limit');
check('settings faz upsert do valor', limitRow.value === '350000');
const allRows = db.prepare('SELECT key, value FROM settings ORDER BY key').all();
check('settings lista todas as chaves', allRows.length === 1 && allRows[0].key === 'monthly_limit');

console.log('migracoes: atomicidade em falha a meio');
const db2 = createDatabase();
const exec2 = createExecutor(db2);
applyMigrations(exec2);
const broken = {
  version: LATEST_VERSION + 1,
  statements: ['CREATE TABLE probe (id TEXT PRIMARY KEY)', 'ISTO NAO E SQL'],
};
MIGRATIONS.push(broken);
expectThrow('migracao invalida lanca erro', () => applyMigrations(exec2));
MIGRATIONS.pop();
check('user_version nao avanca com falha', getSchemaVersion(exec2) === LATEST_VERSION);
check('tabela parcial nao fica criada', !tableNames(db2).includes('probe'));

console.log(`\n${passed} verificacoes passaram, ${failed} falharam`);
if (failed > 0) {
  process.exitCode = 1;
}
