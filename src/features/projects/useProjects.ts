import { useCallback, useMemo, useState } from 'react';

import { projectPaymentLabel } from '../../domain/projectMath';
import { todayISO } from '../../domain/dates';
import {
  createProject,
  deleteProject,
  deleteProjectPayment,
  listProjectPayments,
  listProjects,
  payProject,
  projectsOutstanding,
  projectView,
  setProjectDelivered,
  updateProject,
  updateProjectPayment,
  type ProjectInput,
  type ProjectView,
} from '../../repos/projects';
import { getSetting, setSetting } from '../../repos/settings';

const INCOME_OPTION_KEY = 'project_payments_create_income';

export function useProjects() {
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((value) => value + 1), []);
  const today = todayISO();

  const views = useMemo(() => {
    void tick;
    const all = listProjects().map(projectView);
    return {
      active: all.filter((view) => !view.settled),
      settled: all.filter((view) => view.settled),
    };
  }, [tick]);

  const outstanding = useMemo(() => {
    void tick;
    return projectsOutstanding();
  }, [tick]);

  const createIncomeDefault = getSetting(INCOME_OPTION_KEY) !== '0';

  return {
    today,
    active: views.active,
    settled: views.settled,
    outstanding,
    refresh,
    create: (input: ProjectInput) => {
      const row = createProject(input);
      refresh();
      return row;
    },
    update: (id: string, input: ProjectInput) => {
      updateProject(id, input);
      refresh();
    },
    remove: (id: string) => {
      deleteProject(id);
      refresh();
    },
    pay: (id: string, amount: number, date?: string, createIncome?: boolean) => {
      payProject(id, amount, date, createIncome ?? createIncomeDefault);
      refresh();
    },
    payments: (id: string) => {
      void tick;
      return listProjectPayments(id);
    },
    updatePayment: (paymentId: string, amount: number, date: string) => {
      updateProjectPayment(paymentId, amount, date);
      refresh();
    },
    removePayment: (paymentId: string) => {
      deleteProjectPayment(paymentId);
      refresh();
    },
    deliver: (id: string, delivered: boolean) => {
      setProjectDelivered(id, delivered);
      refresh();
    },
    createIncomeDefault,
    setCreateIncomeDefault: (value: boolean) => {
      setSetting(INCOME_OPTION_KEY, value ? '1' : '0');
      refresh();
    },
  };
}

export function projectChipLabel(view: ProjectView): string {
  return projectPaymentLabel(view.percent);
}
