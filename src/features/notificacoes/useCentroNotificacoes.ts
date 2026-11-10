import { useCallback, useEffect, useMemo, useState } from "react";

import {
  addDays,
  daysBetween,
  formatDayMonthPt,
  todayISO,
} from "../../domain/dates";
import { formatKz } from "../../domain/money";
import { billView, listBills } from "../../repos/bills";
import { bumpDataVersion, subscribeDataVersion } from "../../repos/dataVersion";
import { debtView, listDebts } from "../../repos/debts";
import { goalAmounts, listGoals } from "../../repos/goals";
import { listProjects, projectView } from "../../repos/projects";
import { getSetting, setSetting } from "../../repos/settings";
import { useConfigModulos } from "../modulos/useConfigModulos";

const READ_KEY = "notification_read_ids";
const MAX_READ_IDS = 500;

export type TipoNotificacaoApp = "bill" | "debt" | "project" | "goal";

export type NotificacaoApp = {
  id: string;
  kind: TipoNotificacaoApp;
  title: string;
  body: string;
  /** Data/hora em que o alerta entrou na janela de aviso. */
  createdAt: string;
  href: string;
  read: boolean;
};

type SementeNotificacao = Omit<NotificacaoApp, "read">;

function carregarIdsLidos(): Set<string> {
  const raw = getSetting(READ_KEY);
  if (!raw) return new Set();

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(
      parsed.filter((value): value is string => typeof value === "string"),
    );
  } catch {
    return new Set();
  }
}

function guardarIdsLidos(ids: Set<string>): void {
  // Mantém o ficheiro de definições pequeno; os alertas antigos já não voltam.
  setSetting(READ_KEY, JSON.stringify([...ids].slice(-MAX_READ_IDS)));
}

function rotuloDia(days: number): string {
  if (days < 0)
    return `Atrasada desde ${formatDayMonthPt(addDays(todayISO(), days))}`;
  if (days === 0) return "Vence hoje";
  return `Vence em ${days} ${days === 1 ? "dia" : "dias"}`;
}

function rotuloPrazo(days: number, phrase: string): string {
  if (days < 0) return phrase === "Prazo" ? "Prazo passou" : "Entrega atrasada";
  if (days === 0) return `${phrase} hoje`;
  return `${phrase} em ${days} ${days === 1 ? "dia" : "dias"}`;
}

/**
 * Centro de notificações local: não guarda uma cópia dos eventos, deriva os
 * alertas das tabelas reais. Só a marcação de lido é persistida, numa lista de
 * IDs em `settings`.
 */
export function useCentroNotificacoes(): {
  items: NotificacaoApp[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
  refresh: () => void;
} {
  const { modules } = useConfigModulos();
  const [tick, setTick] = useState(0);
  const [readIds, setReadIds] = useState<Set<string>>(carregarIdsLidos);

  const refresh = useCallback(() => {
    setReadIds(carregarIdsLidos());
    setTick((value) => value + 1);
  }, []);

  useEffect(() => subscribeDataVersion(refresh), [refresh]);

  const today = todayISO();

  const seeds = useMemo(() => {
    void tick;
    const list: SementeNotificacao[] = [];
    const now = Date.now();

    const add = (seed: SementeNotificacao) => {
      if (new Date(seed.createdAt).getTime() <= now) list.push(seed);
    };

    if (modules.fixed_expenses) {
      for (const bill of listBills()) {
        if (bill.active !== 1) continue;
        const view = billView(bill, today);
        if (
          view.paidThisMonth ||
          view.dueDate === null ||
          view.daysToDue === null
        ) {
          continue;
        }
        if (view.daysToDue > bill.remind_days_before) continue;

        const createdAt = addDays(view.dueDate, -bill.remind_days_before);
        add({
          id: `bill:${bill.id}:${view.dueDate}`,
          kind: "bill",
          title: bill.name,
          body: `${rotuloDia(view.daysToDue)} · ${formatKz(bill.amount)}`,
          createdAt: `${createdAt}T09:00:00`,
          href: "/bill",
        });
      }
    }

    if (modules.debts) {
      for (const debt of listDebts()) {
        if (debt.due_date === null) continue;
        const view = debtView(debt, today);
        if (view.status === "paid") continue;

        const days = daysBetween(today, debt.due_date);
        if (days > 3) continue;

        const createdAt = addDays(debt.due_date, -3);
        add({
          id: `debt:${debt.id}:${debt.due_date}`,
          kind: "debt",
          title: debt.party,
          body: `${rotuloDia(days)} · ${formatKz(view.remaining)}`,
          createdAt: `${createdAt}T09:00:00`,
          href: `/debt/${debt.id}`,
        });
      }
    }

    if (modules.projects) {
      for (const project of listProjects()) {
        if (project.due_date === null) continue;
        const view = projectView(project);
        if (view.settled) continue;

        const days = daysBetween(today, project.due_date);
        if (days > 7) continue;

        const createdAt = addDays(project.due_date, -7);
        add({
          id: `project:${project.id}:${project.due_date}`,
          kind: "project",
          title: project.name,
          body: `${rotuloPrazo(days, "Entrega")} · falta ${formatKz(view.remaining)}`,
          createdAt: `${createdAt}T09:00:00`,
          href: `/project/${project.id}`,
        });
      }
    }

    if (modules.goals_savings) {
      for (const goal of listGoals()) {
        if (goal.archived_at !== null || goal.deadline === null) continue;
        const { saved } = goalAmounts(goal.id);
        const remaining = Math.max(0, goal.target - saved);
        if (remaining === 0) continue;

        const days = daysBetween(today, goal.deadline);
        if (days > 7) continue;

        const createdAt = addDays(goal.deadline, -7);
        add({
          id: `goal:${goal.id}:${goal.deadline}`,
          kind: "goal",
          title: goal.name,
          body: `${rotuloPrazo(days, "Prazo")} · faltam ${formatKz(remaining)}`,
          createdAt: `${createdAt}T09:00:00`,
          href: `/goal/${goal.id}`,
        });
      }
    }

    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [modules, tick, today]);

  const items = useMemo(
    () => seeds.map((seed) => ({ ...seed, read: readIds.has(seed.id) })),
    [readIds, seeds],
  );

  const markRead = useCallback((id: string) => {
    const current = carregarIdsLidos();
    if (current.has(id)) return;
    current.add(id);
    guardarIdsLidos(current);
    setReadIds(current);
    bumpDataVersion();
  }, []);

  const markAllRead = useCallback(() => {
    const current = carregarIdsLidos();
    for (const item of items) current.add(item.id);
    guardarIdsLidos(current);
    setReadIds(current);
    bumpDataVersion();
  }, [items]);

  return {
    items,
    unreadCount: items.filter((item) => !item.read).length,
    markRead,
    markAllRead,
    refresh,
  };
}
