export function projectRemaining(total: number, received: number): number {
  return Math.max(0, total - received);
}

export function projectPercentPaid(total: number, received: number): number {
  if (total <= 0) {
    return 0;
  }

  const percent = Math.round((received / total) * 100);
  return Math.min(100, Math.max(0, percent));
}

export function projectPaymentLabel(percent: number): string {
  if (percent >= 100) {
    return 'Pago';
  }

  if (percent <= 0) {
    return 'Por receber';
  }

  return `${percent}% pago`;
}

export function projectsOutstandingTotal(projects: { total: number; received: number }[]): number {
  return projects.reduce((sum, project) => sum + projectRemaining(project.total, project.received), 0);
}
