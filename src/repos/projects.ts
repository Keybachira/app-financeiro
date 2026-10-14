import * as Crypto from 'expo-crypto';

import { projectRemaining } from '../domain/projectMath';
import { todayISO } from '../domain/dates';
import { db } from '../db/client';

export type ProjectRow = {
  id: string;
  name: string;
  client: string | null;
  total: number;
  due_date: string | null;
  created_at: string;
  delivered_at: string | null;
  note: string | null;
};

export type ProjectPaymentRow = {
  id: string;
  project_id: string;
  amount: number;
  date: string;
  movement_id: string | null;
};

export type ProjectInput = {
  name: string;
  client: string | null;
  total: number;
  dueDate: string | null;
  note: string | null;
};

export function listProjects(): ProjectRow[] {
  return db.getAllSync<ProjectRow>(
    'SELECT id, name, client, total, due_date, created_at, delivered_at, note FROM projects ORDER BY created_at DESC'
  );
}

export function getProject(id: string): ProjectRow | null {
  return db.getFirstSync<ProjectRow>(
    'SELECT id, name, client, total, due_date, created_at, delivered_at, note FROM projects WHERE id = ?',
    [id]
  );
}

export function listProjectPayments(projectId?: string): ProjectPaymentRow[] {
  if (projectId) {
    return db.getAllSync<ProjectPaymentRow>(
      'SELECT id, project_id, amount, date, movement_id FROM project_payments WHERE project_id = ? ORDER BY date DESC, rowid DESC',
      [projectId]
    );
  }

  return db.getAllSync<ProjectPaymentRow>(
    'SELECT id, project_id, amount, date, movement_id FROM project_payments ORDER BY date DESC, rowid DESC'
  );
}

export function projectReceived(id: string): number {
  const row = db.getFirstSync<{ received: number | null }>(
    'SELECT SUM(amount) AS received FROM project_payments WHERE project_id = ?',
    [id]
  );
  return row?.received ?? 0;
}

export function projectsOutstanding(): number {
  const projects = listProjects();
  return projects.reduce((sum, project) => sum + projectRemaining(project.total, projectReceived(project.id)), 0);
}

export function createProject(input: ProjectInput): ProjectRow {
  const row: ProjectRow = {
    id: Crypto.randomUUID(),
    name: input.name,
    client: input.client,
    total: input.total,
    due_date: input.dueDate,
    created_at: todayISO(),
    delivered_at: null,
    note: input.note,
  };

  db.runSync(
    `INSERT INTO projects (id, name, client, total, due_date, created_at, delivered_at, note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [row.id, row.name, row.client, row.total, row.due_date, row.created_at, row.delivered_at, row.note]
  );

  return row;
}

export function updateProject(id: string, input: ProjectInput): void {
  db.runSync(
    'UPDATE projects SET name = ?, client = ?, total = ?, due_date = ?, note = ? WHERE id = ?',
    [input.name, input.client, input.total, input.dueDate, input.note, id]
  );
}

export function setProjectDelivered(id: string, delivered: boolean): void {
  db.runSync('UPDATE projects SET delivered_at = ? WHERE id = ?', [delivered ? todayISO() : null, id]);
}

export function deleteProject(id: string): void {
  db.runSync('DELETE FROM projects WHERE id = ?', [id]);
}

export function payProject(id: string, amount: number, date = todayISO(), createIncome = true): void {
  db.withTransactionSync(() => {
    insertPayment(id, amount, date, createIncome);
  });
}

export function updateProjectPayment(paymentId: string, amount: number, date: string): void {
  db.withTransactionSync(() => {
    db.runSync('UPDATE project_payments SET amount = ?, date = ? WHERE id = ?', [amount, date, paymentId]);

    const payment = db.getFirstSync<ProjectPaymentRow>(
      'SELECT id, project_id, amount, date, movement_id FROM project_payments WHERE id = ?',
      [paymentId]
    );

    if (payment?.movement_id) {
      db.runSync('UPDATE movements SET amount = ?, date = ? WHERE id = ?', [amount, date, payment.movement_id]);
    }
  });
}

export function deleteProjectPayment(paymentId: string): void {
  db.withTransactionSync(() => {
    const payment = db.getFirstSync<ProjectPaymentRow>(
      'SELECT id, project_id, amount, date, movement_id FROM project_payments WHERE id = ?',
      [paymentId]
    );

    db.runSync('DELETE FROM project_payments WHERE id = ?', [paymentId]);

    if (payment?.movement_id) {
      db.runSync('DELETE FROM movements WHERE id = ?', [payment.movement_id]);
    }
  });
}

export function projectView(project: ProjectRow) {
  const received = projectReceived(project.id);
  const remaining = projectRemaining(project.total, received);
  const percent = project.total > 0 ? Math.round((received / project.total) * 100) : 0;

  return {
    project,
    received,
    remaining,
    percent: Math.min(100, Math.max(0, percent)),
    progress: project.total > 0 ? received / project.total : 0,
    settled: remaining === 0,
  };
}

export type ProjectView = ReturnType<typeof projectView>;

function insertPayment(id: string, amount: number, date: string, createIncome: boolean): void {
  const project = getProject(id);

  if (!project) {
    throw new Error('Projeto não encontrado.');
  }

  const movementId = createIncome ? Crypto.randomUUID() : null;

  if (movementId) {
    db.runSync('INSERT INTO movements (id, type, amount, category, date, note) VALUES (?, ?, ?, ?, ?, ?)', [
      movementId,
      'income',
      amount,
      'Projetos',
      date,
      `Projeto · ${project.name}`,
    ]);
  }

  db.runSync('INSERT INTO project_payments (id, project_id, amount, date, movement_id) VALUES (?, ?, ?, ?, ?)', [
    Crypto.randomUUID(),
    id,
    amount,
    date,
    movementId,
  ]);
}
