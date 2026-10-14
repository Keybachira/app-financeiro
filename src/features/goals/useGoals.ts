import { useCallback, useMemo, useState } from 'react';

import {
  goalExpectedByNow,
  goalPace,
  goalProgress,
  isGoalCompleted,
  monthlySavingsNeeded,
  type GoalPaceStatus,
} from '../../domain/goalMath';
import {
  createGoal,
  deleteGoal,
  deleteGoalOp,
  depositToGoal,
  getGoal,
  goalAmounts,
  listGoalOps,
  listGoals,
  reservedTotal,
  setGoalArchived,
  updateGoal,
  withdrawFromGoal,
  type GoalInput,
  type GoalOpRow,
  type GoalRow,
} from '../../repos/goals';
import { todayISO } from '../../domain/dates';

export type GoalView = {
  goal: GoalRow;
  saved: number;
  deposits: number;
  withdraws: number;
  progress: number;
  completed: boolean;
  pace: GoalPaceStatus;
  monthlyNeeded: number;
  paceDelta: number;
};

function toView(goal: GoalRow): GoalView {
  const { deposits, withdraws, saved } = goalAmounts(goal.id);
  const today = todayISO();

  return {
    goal,
    saved,
    deposits,
    withdraws,
    progress: goalProgress(saved, goal.target),
    completed: isGoalCompleted(saved, goal.target),
    pace: goalPace({ saved, target: goal.target, createdAt: goal.created_at, deadline: goal.deadline, today }),
    monthlyNeeded: monthlySavingsNeeded(goal.target, saved, goal.deadline, today),
    paceDelta: (goalExpectedByNow({ target: goal.target, createdAt: goal.created_at, deadline: goal.deadline, today }) ?? 0) - saved,
  };
}

export function useGoals(): {
  active: GoalView[];
  completed: GoalView[];
  archived: GoalView[];
  reserved: number;
  refresh: () => void;
  create: (input: GoalInput) => GoalRow;
  update: (id: string, input: GoalInput) => void;
  remove: (id: string) => void;
  archive: (id: string, archived: boolean) => void;
  deposit: (id: string, amount: number) => void;
  withdraw: (id: string, amount: number) => void;
  detail: (id: string) => GoalView | null;
  ops: (id: string) => GoalOpRow[];
  removeOp: (id: string) => void;
} {
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((value) => value + 1), []);

  const views = useMemo(() => {
    void tick;
    const goals = listGoals().map(toView);
    return {
      active: goals.filter((view) => view.goal.archived_at === null && !view.completed),
      completed: goals.filter((view) => view.goal.archived_at === null && view.completed),
      archived: goals.filter((view) => view.goal.archived_at !== null),
    };
  }, [tick]);

  const reserved = useMemo(() => {
    void tick;
    return reservedTotal();
  }, [tick]);

  const detail = useCallback(
    (id: string) => {
      const goal = getGoal(id);
      return goal ? toView(goal) : null;
    },
    [tick]
  );

  return {
    active: views.active,
    completed: views.completed,
    archived: views.archived,
    reserved,
    refresh,
    create: (input) => {
      const row = createGoal(input);
      refresh();
      return row;
    },
    update: (id, input) => {
      updateGoal(id, input);
      refresh();
    },
    remove: (id) => {
      deleteGoal(id);
      refresh();
    },
    archive: (id, archived) => {
      setGoalArchived(id, archived);
      refresh();
    },
    deposit: (id, amount) => {
      depositToGoal(id, amount);
      refresh();
    },
    withdraw: (id, amount) => {
      withdrawFromGoal(id, amount);
      refresh();
    },
    detail,
    ops: (id) => {
      void tick;
      return listGoalOps(id);
    },
    removeOp: (id) => {
      deleteGoalOp(id);
      refresh();
    },
  };
}
