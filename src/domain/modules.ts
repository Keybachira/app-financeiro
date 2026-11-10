export const MODULE_IDS = [
  "movements", // essential
  "salary_income",
  "goals_savings",
  "debts",
  "projects",
  "fixed_expenses",
  "daily_limit",
] as const;

export type ModuleId = (typeof MODULE_IDS)[number];

export type ModuleProfileId = "student" | "worker" | "freelancer" | "custom";

export type ModuleDefinition = {
  id: ModuleId;
  label: string;
  description: string;
  essential?: boolean;
  dependsOn?: ModuleId[];
};

export const MODULE_DEFINITIONS: ModuleDefinition[] = [
  {
    id: "movements",
    label: "Movimentos",
    description: "Registo essencial de receitas e despesas.",
    essential: true,
  },
  {
    id: "salary_income",
    label: "Sal�rio e rendimentos",
    description: "Configura��o e automa��o de rendimentos.",
    dependsOn: ["movements"],
  },
  {
    id: "goals_savings",
    label: "Metas e poupan�as",
    description: "Metas, dep�sitos e levantamentos.",
    dependsOn: ["movements"],
  },
  {
    id: "debts",
    label: "D�vidas",
    description: "D�vidas a pagar/receber e pagamentos.",
  },
  {
    id: "projects",
    label: "Projetos",
    description: "Projetos e recebimentos.",
  },
  {
    id: "fixed_expenses",
    label: "Despesas fixas",
    description: "Contas fixas, pagamentos e lembretes.",
    dependsOn: ["movements"],
  },
  {
    id: "daily_limit",
    label: "Limite di�rio",
    description: "Limite mensal e controlo di�rio.",
  },
];

export const DEFAULT_MODULE_STATES: Record<ModuleId, boolean> = {
  movements: true,
  salary_income: true,
  goals_savings: true,
  debts: true,
  projects: true,
  fixed_expenses: true,
  daily_limit: true,
};

export const PROFILE_MODULE_STATES: Record<
  ModuleProfileId,
  Record<ModuleId, boolean>
> = {
  student: {
    movements: true,
    salary_income: false,
    goals_savings: true,
    debts: true,
    projects: false,
    fixed_expenses: true,
    daily_limit: true,
  },
  worker: {
    movements: true,
    salary_income: true,
    goals_savings: true,
    debts: true,
    projects: false,
    fixed_expenses: true,
    daily_limit: true,
  },
  freelancer: {
    movements: true,
    salary_income: true,
    goals_savings: true,
    debts: true,
    projects: true,
    fixed_expenses: true,
    daily_limit: true,
  },
  custom: { ...DEFAULT_MODULE_STATES },
};

export function sanitizeModuleStates(
  input: Partial<Record<ModuleId, boolean>> | null | undefined,
): Record<ModuleId, boolean> {
  const next = { ...DEFAULT_MODULE_STATES };
  if (input) {
    for (const id of MODULE_IDS) {
      if (typeof input[id] === "boolean") next[id] = input[id] as boolean;
    }
  }
  next.movements = true; // essencial
  // depend�ncias: desativar dependentes se depend�ncia estiver off
  let changed = true;
  while (changed) {
    changed = false;
    for (const def of MODULE_DEFINITIONS) {
      if (!next[def.id]) continue;
      for (const dep of def.dependsOn ?? []) {
        if (!next[dep]) {
          next[def.id] = false;
          changed = true;
        }
      }
    }
  }
  next.movements = true;
  return next;
}

export function detectProfile(
  states: Record<ModuleId, boolean>,
): ModuleProfileId {
  const s = sanitizeModuleStates(states);
  for (const id of ["student", "worker", "freelancer"] as const) {
    if (MODULE_IDS.every((m) => s[m] === PROFILE_MODULE_STATES[id][m]))
      return id;
  }
  return "custom";
}
