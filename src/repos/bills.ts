import * as Notifications from 'expo-notifications';
import * as Crypto from 'expo-crypto';

import { addDays, monthKey, todayISO } from '../domain/dates';
import { nextBillDueDate } from '../domain/bills';
import { db } from '../db/client';

export type BillRow = {
  id: string;
  name: string;
  icon: string | null;
  amount: number;
  day_of_month: number;
  remind_days_before: number;
  category: string;
  active: number;
};

export type BillPaymentRow = {
  id: string;
  bill_id: string;
  month: string;
  paid_on: string;
  amount: number;
  movement_id: string | null;
};

export type BillInput = {
  name: string;
  amount: number;
  dayOfMonth: number;
  remindDaysBefore: number;
  category: string;
  icon: string | null;
};

const CHANNEL_ID = 'bills';

export const listBills = (): BillRow[] =>
  db.getAllSync<BillRow>(
    'SELECT id, name, icon, amount, day_of_month, remind_days_before, category, active FROM bills ORDER BY day_of_month, name'
  );

export const getBill = (id: string): BillRow | null =>
  db.getFirstSync<BillRow>(
    'SELECT id, name, icon, amount, day_of_month, remind_days_before, category, active FROM bills WHERE id = ?',
    [id]
  );

export const listBillPayments = (billId?: string): BillPaymentRow[] => {
  if (billId) {
    return db.getAllSync<BillPaymentRow>(
      'SELECT id, bill_id, month, paid_on, amount, movement_id FROM bill_payments WHERE bill_id = ? ORDER BY paid_on DESC',
      [billId]
    );
  }

  return db.getAllSync<BillPaymentRow>(
    'SELECT id, bill_id, month, paid_on, amount, movement_id FROM bill_payments ORDER BY paid_on DESC'
  );
};

export const paidMonthsForBill = (billId: string): Set<string> =>
  new Set(listBillPayments(billId).map((payment) => payment.month));

export const isBillPaidInMonth = (billId: string, month: string): boolean =>
  paidMonthsForBill(billId).has(month);

export const billsUnpaidTotal = (month: string): number => {
  const rows = db.getAllSync<{ total: number | null }>(
    `SELECT SUM(amount) AS total FROM bills b
     WHERE b.active = 1
       AND NOT EXISTS (SELECT 1 FROM bill_payments p WHERE p.bill_id = b.id AND p.month = ?)`,
    [month]
  );
  return rows[0]?.total ?? 0;
};

export const billsMonthProgress = (month: string): { paid: number; total: number } => {
  const row = db.getFirstSync<{ paid: number | null; total: number | null }>(
    `SELECT
       COALESCE(SUM(CASE WHEN EXISTS (SELECT 1 FROM bill_payments p WHERE p.bill_id = b.id AND p.month = ?) THEN b.amount ELSE 0 END), 0) AS paid,
       COALESCE(SUM(CASE WHEN b.active = 1 THEN b.amount ELSE 0 END), 0) AS total
     FROM bills b`,
    [month]
  );
  return { paid: row?.paid ?? 0, total: row?.total ?? 0 };
};

export function createBill(input: BillInput): BillRow {
  const row: BillRow = {
    id: Crypto.randomUUID(),
    name: input.name,
    icon: input.icon,
    amount: input.amount,
    day_of_month: input.dayOfMonth,
    remind_days_before: input.remindDaysBefore,
    category: input.category,
    active: 1,
  };

  db.runSync(
    `INSERT INTO bills (id, name, icon, amount, day_of_month, remind_days_before, category, active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [row.id, row.name, row.icon, row.amount, row.day_of_month, row.remind_days_before, row.category, row.active]
  );

  void scheduleBillNotification(row);
  return row;
}

export function updateBill(id: string, input: BillInput): void {
  db.runSync(
    'UPDATE bills SET name = ?, icon = ?, amount = ?, day_of_month = ?, remind_days_before = ?, category = ? WHERE id = ?',
    [input.name, input.icon, input.amount, input.dayOfMonth, input.remindDaysBefore, input.category, id]
  );

  const bill = getBill(id);

  if (bill) {
    void scheduleBillNotification(bill);
  }
}

export function setBillActive(id: string, active: boolean): void {
  db.runSync('UPDATE bills SET active = ? WHERE id = ?', [active ? 1 : 0, id]);

  const bill = getBill(id);

  if (bill) {
    if (active) {
      void scheduleBillNotification(bill);
    } else {
      void cancelBillNotification(id);
    }
  }
}

export function deleteBill(id: string): void {
  db.runSync('DELETE FROM bills WHERE id = ?', [id]);
  void cancelBillNotification(id);
}

export function payBill(id: string, date = todayISO()): void {
  const bill = getBill(id);

  if (!bill) {
    throw new Error('Conta não encontrada.');
  }

  const month = monthKey(date);

  if (isBillPaidInMonth(id, month)) {
    throw new Error('Esta conta já foi paga neste mês.');
  }

  db.withTransactionSync(() => {
    const movementId = Crypto.randomUUID();

    db.runSync('INSERT INTO movements (id, type, amount, category, date, note) VALUES (?, ?, ?, ?, ?, ?)', [
      movementId,
      'expense',
      bill.amount,
      bill.category,
      date,
      bill.name,
    ]);

    db.runSync(
      'INSERT INTO bill_payments (id, bill_id, month, paid_on, amount, movement_id) VALUES (?, ?, ?, ?, ?, ?)',
      [Crypto.randomUUID(), id, month, date, bill.amount, movementId]
    );
  });

  void cancelBillNotification(id);
  void scheduleBillNotification(bill);
}

export function deleteBillPayment(paymentId: string): void {
  db.withTransactionSync(() => {
    const payment = db.getFirstSync<BillPaymentRow>(
      'SELECT id, bill_id, month, paid_on, amount, movement_id FROM bill_payments WHERE id = ?',
      [paymentId]
    );

    db.runSync('DELETE FROM bill_payments WHERE id = ?', [paymentId]);

    if (payment?.movement_id) {
      db.runSync('DELETE FROM movements WHERE id = ?', [payment.movement_id]);
    }

    if (payment) {
      const bill = getBill(payment.bill_id);
      if (bill) {
        void scheduleBillNotification(bill);
      }
    }
  });
}

export function billView(bill: BillRow, today: string) {
  const month = monthKey(today);
  const paid = isBillPaidInMonth(bill.id, month);
  const dueDate = paid ? null : nextBillDueDate({ dayOfMonth: bill.day_of_month }, today, (paidMonth) => paidMonthsForBill(bill.id).has(paidMonth));
  const daysToDue = dueDate === null ? null : Math.round((Date.parse(dueDate) - Date.parse(today)) / 86400000);

  return {
    bill,
    paidThisMonth: paid,
    dueDate,
    daysToDue,
    status: paid ? ('paid' as const) : dueDate === today ? ('today' as const) : (daysToDue ?? 0) < 0 ? ('late' as const) : (daysToDue ?? 0) <= 7 ? ('soon' as const) : ('upcoming' as const),
    paidOn: paid ? (listBillPayments(bill.id).find((payment) => payment.month === month)?.paid_on ?? null) : null,
  };
}

export type BillView = ReturnType<typeof billView>;

export async function ensureNotificationSetup(): Promise<void> {
  const { status } = await Notifications.getPermissionsAsync();
  let finalStatus = status;

  if (status !== 'granted') {
    const request = await Notifications.requestPermissionsAsync();
    finalStatus = request.status;
  }

  if (finalStatus !== 'granted') {
    return;
  }

  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Contas fixas',
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: '#5B8DFF',
  });
}

export async function scheduleBillNotification(bill: BillRow): Promise<void> {
  try {
    const today = todayISO();
    const dueDate = nextBillDueDate({ dayOfMonth: bill.day_of_month }, today, (month) => paidMonthsForBill(bill.id).has(month));

    if (dueDate === null) {
      return;
    }

    await cancelBillNotification(bill.id);

    const triggerDate = triggerDateFor(dueDate, bill.remind_days_before);

    if (triggerDate.getTime() <= Date.now()) {
      return;
    }

    await Notifications.scheduleNotificationAsync({
      identifier: notificationId(bill.id),
      content: {
        title: bill.name,
        body: `Vence a ${formatDayPt(dueDate)} · ${bill.amount.toLocaleString('pt-AO')} Kz`,
        data: { billId: bill.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
        channelId: CHANNEL_ID,
      },
    });
  } catch {
    // Sem permissões ou indisponível: a aplicação continua a funcionar sem notificações.
  }
}

export async function cancelBillNotification(billId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId(billId));
  } catch {
    // Notificação inexistente: nada a cancelar.
  }
}

export async function rescheduleAllBillNotifications(): Promise<void> {
  await ensureNotificationSetup();

  for (const bill of listBills()) {
    if (bill.active === 1) {
      await scheduleBillNotification(bill);
    }
  }
}

function notificationId(billId: string): string {
  return `bill-${billId}`;
}

function triggerDateFor(dueDate: string, remindDaysBefore: number): Date {
  const remind = addDays(dueDate, -remindDaysBefore);
  return new Date(`${remind}T09:00:00`);
}

function formatDayPt(iso: string): string {
  return iso.slice(8, 10);
}
