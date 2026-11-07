import * as Crypto from 'expo-crypto';

import { addDays, monthKey, todayISO } from '../domain/dates';
import { nextBillDueDate } from '../domain/bills';
import { db } from '../db/client';
import {
  configureNotificationHandling,
  getNotifications,
  requestNotificationPermission,
  type NotificationPermissionState,
} from './notifications';
import { getSetting, setSetting } from './settings';

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

export type BillNotificationStatus = {
  state: 'scheduled' | 'permission_denied' | 'unavailable' | 'not_scheduled' | 'error';
  message: string | null;
  checkedAt: string;
};

const BILL_NOTIFICATIONS_STATUS_KEY = 'bill_notifications_status';
const CHANNEL_ID = 'bills';

export function getBillNotificationsStatus(): BillNotificationStatus | null {
  const raw = getSetting(BILL_NOTIFICATIONS_STATUS_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<BillNotificationStatus>;
    if (
      parsed &&
      typeof parsed.state === 'string' &&
      typeof parsed.checkedAt === 'string'
    ) {
      return {
        state: parsed.state as BillNotificationStatus['state'],
        message: typeof parsed.message === 'string' ? parsed.message : null,
        checkedAt: parsed.checkedAt,
      };
    }
  } catch {
    // Ignorar valor invÃ¡lido.
  }
  return null;
}

function setBillNotificationsStatus(status: BillNotificationStatus): void {
  setSetting(BILL_NOTIFICATIONS_STATUS_KEY, JSON.stringify(status));
}

export async function ensureNotificationSetup(): Promise<NotificationPermissionState> {
  const Notifications = getNotifications();
  if (!Notifications) return 'unavailable';
  try {
    await configureNotificationHandling();
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') return permission;
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Contas fixas',
      importance: Notifications.AndroidImportance.DEFAULT,
      lightColor: '#5B8DFF',
    });
    return 'granted';
  } catch {
    return 'unavailable';
  }
}

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
       COALESCE(SUM(CASE WHEN b.active = 1 THEN (
         SELECT COALESCE(SUM(p.amount), 0) FROM bill_payments p
         WHERE p.bill_id = b.id AND p.month = ?
       ) ELSE 0 END), 0) AS paid,
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
    throw new Error('Conta nÃ£o encontrada.');
  }

  const month = monthKey(date);

  if (isBillPaidInMonth(id, month)) {
    throw new Error('Esta conta jÃ¡ foi paga neste mÃªs.');
  }

  db.withTransactionSync(() => {
    const movementId = Crypto.randomUUID();

    db.runSync(
      'INSERT INTO movements (id, type, amount, category, date, note, origin) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [movementId, 'expense', bill.amount, bill.category, date, bill.name, 'bill']
    );

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

export async function scheduleBillNotification(bill: BillRow): Promise<BillNotificationStatus> {
  const checkedAt = todayISO();
  const Notifications = getNotifications();
  if (!Notifications) {
    const status: BillNotificationStatus = { state: 'unavailable', message: 'Notificações indisponíveis neste dispositivo/build.', checkedAt };
    setBillNotificationsStatus(status);
    return status;
  }
  try {
    if (bill.active !== 1) {
      await cancelBillNotification(bill.id);
      return { state: 'not_scheduled', message: null, checkedAt };
    }
    const permission = await ensureNotificationSetup();
    if (permission === 'denied') {
      const status: BillNotificationStatus = { state: 'permission_denied', message: 'Permissão de notificações recusada.', checkedAt };
      setBillNotificationsStatus(status);
      return status;
    }
    if (permission === 'unavailable') {
      const status: BillNotificationStatus = { state: 'unavailable', message: 'Sistema de notificações indisponível.', checkedAt };
      setBillNotificationsStatus(status);
      return status;
    }

    const today = todayISO();
    const dueDate = nextBillDueDate({ dayOfMonth: bill.day_of_month }, today, (month) => paidMonthsForBill(bill.id).has(month));
    await cancelBillNotification(bill.id);
    if (dueDate === null) {
      const status: BillNotificationStatus = { state: 'not_scheduled', message: null, checkedAt };
      setBillNotificationsStatus(status);
      return status;
    }
    const triggerDate = triggerDateFor(dueDate, bill.remind_days_before);
    if (triggerDate.getTime() <= Date.now()) {
      const status: BillNotificationStatus = { state: 'not_scheduled', message: 'Data de lembrete já passou para o próximo vencimento.', checkedAt };
      setBillNotificationsStatus(status);
      return status;
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
    const status: BillNotificationStatus = { state: 'scheduled', message: null, checkedAt };
    setBillNotificationsStatus(status);
    return status;
  } catch (error) {
    const status: BillNotificationStatus = {
      state: 'error',
      message: error instanceof Error ? error.message : 'Falha ao agendar notificação.',
      checkedAt,
    };
    setBillNotificationsStatus(status);
    return status;
  }
}

export async function cancelBillNotification(billId: string): Promise<void> {
  const Notifications = getNotifications();
  if (!Notifications) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId(billId));
  } catch {
    // Notificação inexistente: nada a cancelar.
  }
}

export async function rescheduleAllBillNotifications(): Promise<BillNotificationStatus> {
  const checkedAt = todayISO();
  const permission = await ensureNotificationSetup();
  if (permission === 'denied') {
    const status: BillNotificationStatus = { state: 'permission_denied', message: 'Permissão de notificações recusada.', checkedAt };
    setBillNotificationsStatus(status);
    return status;
  }
  if (permission === 'unavailable') {
    const status: BillNotificationStatus = { state: 'unavailable', message: 'Notificações indisponíveis.', checkedAt };
    setBillNotificationsStatus(status);
    return status;
  }
  let last: BillNotificationStatus = { state: 'not_scheduled', message: null, checkedAt };
  for (const bill of listBills()) {
    if (bill.active === 1) {
      last = await scheduleBillNotification(bill);
    } else {
      await cancelBillNotification(bill.id);
    }
  }
  setBillNotificationsStatus(last);
  return last;
}

export async function resetBillNotificationsState(): Promise<void> {
  const Notifications = getNotifications();
  if (Notifications) {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch {
      // Ignorar.
    }
  }
  setBillNotificationsStatus({ state: 'not_scheduled', message: 'Estado de notificações reiniciado após importação.', checkedAt: todayISO() });
}

function notificationId(billId: string): string {
  return `bill-${billId}`;
}

function triggerDateFor(dueDate: string, remindDaysBefore: number): Date {
  const remind = addDays(dueDate, -remindDaysBefore);
  const d = new Date(`${remind}T09:00:00`);
  return Number.isNaN(d.getTime()) ? new Date(Date.now() + 60_000) : d;
}

function formatDayPt(iso: string): string {
  return iso.slice(8, 10);
}
