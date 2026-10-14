import { monthsBetween } from './dates';

export type GoalPaceStatus = 'completed' | 'ahead' | 'onTrack' | 'behind';

export function goalSaved(deposits: number, withdraws: number): number {
  return deposits - withdraws;
}

export function goalProgress(saved: number, target: number): number {
  if (target <= 0) {
    return 0;
  }

  return Math.min(saved / target, 1);
}

export function isGoalCompleted(saved: number, target: number): boolean {
  return target > 0 && saved >= target;
}

export function monthsUntilDeadline(deadline: string | null, today: string): number {
  if (!deadline) {
    return 0;
  }

  return Math.max(0, monthsBetween(today, deadline));
}

export function monthlySavingsNeeded(
  target: number,
  saved: number,
  deadline: string | null,
  today: string
): number {
  const remaining = target - saved;

  if (remaining <= 0) {
    return 0;
  }

  const months = Math.max(1, monthsUntilDeadline(deadline, today));
  return Math.ceil(remaining / months);
}

export function goalPace(input: {
  saved: number;
  target: number;
  createdAt: string;
  deadline: string | null;
  today: string;
}): GoalPaceStatus {
  const { saved, target, createdAt, deadline, today } = input;

  if (isGoalCompleted(saved, target)) {
    return 'completed';
  }

  if (!deadline) {
    return 'onTrack';
  }

  const totalMonths = monthsBetween(createdAt, deadline);

  if (totalMonths <= 0) {
    return 'behind';
  }

  const elapsed = Math.min(Math.max(monthsBetween(createdAt, today), 0), totalMonths);
  const expected = (target * elapsed) / totalMonths;

  if (saved > expected) {
    return 'ahead';
  }

  if (saved < expected) {
    return 'behind';
  }

  return 'onTrack';
}

export function goalExpectedByNow(input: {
  target: number;
  createdAt: string;
  deadline: string | null;
  today: string;
}): number | null {
  const { target, createdAt, deadline, today } = input;

  if (!deadline) {
    return null;
  }

  const totalMonths = monthsBetween(createdAt, deadline);

  if (totalMonths <= 0) {
    return target;
  }

  const elapsed = Math.min(Math.max(monthsBetween(createdAt, today), 0), totalMonths);
  return (target * elapsed) / totalMonths;
}
