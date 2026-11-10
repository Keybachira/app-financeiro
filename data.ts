// Meu Kumbo — data.ts
// Tipos, dados de exemplo, tema (claro/escuro), store em memória, helpers e estilos partilhados.
// Ponto de integração: troca as ações do objeto `A` por chamadas ao teu repositório SQLite.
// Fallback de desenvolvimento: com USE_SAMPLE_DATA = true a app arranca com dados de exemplo.

import { useMemo, useSyncExternalStore, type ComponentProps } from "react";
import { StyleSheet, useColorScheme } from "react-native";
import { router } from "expo-router";
import type { Feather } from "@expo/vector-icons";
import { getSetting, setSetting } from "./src/repos/settings";
import { bumpDataVersion } from "./src/repos/dataVersion";
import { useAppPreferences } from "./src/features/settings/useAppPreferences";
import { darkColors, lightColors } from "./src/ui/theme";

// A fonte financeira oficial é o SQLite. Os ecrãs em migração podem continuar
// a importar helpers deste módulo, mas não devem usar o store demo abaixo.
export const USE_SAMPLE_DATA = false;

/* ───────────── Tipos ───────────── */
export type Mov = { id: string; t: string; c: string; v: number; dt: string };
export type Meta = { id: string; nome: string; atual: number; alvo: number };
export type Divida = { id: string; nome: string; valor: number; vence: string };
export type Projeto = {
  id: string;
  nome: string;
  gasto: number;
  orcamento: number;
};
export type Fixa = { id: string; nome: string; valor: number; dia: number };
export type ModKey =
  "salario" | "metas" | "dividas" | "projetos" | "fixas" | "limite";
export type Perfil =
  "Estudante" | "Trabalhador" | "Freelancer" | "Empresario" |"Personalizado";
export type NotifKind = "danger" | "warn" | "info" | "ok";
export type Notif = {
  id: string;
  k: NotifKind;
  i: string;
  t: string;
  b: string;
  ts: number;
  read: boolean;
};
export type ThemePref = "system" | "light" | "dark";
export type ItemTipo = "metas" | "dividas" | "projetos" | "fixas";

export type State = {
  name: string;
  base: number;
  hid: boolean;
  theme: ThemePref;
  prof: Perfil;
  mod: Record<ModKey, boolean>;
  movs: Mov[];
  metas: Meta[];
  dividas: Divida[];
  projetos: Projeto[];
  fixas: Fixa[];
  notifs: Notif[];
  // alertas
  lim: number;
  push: boolean;
  t80: boolean;
  t100: boolean;
  big: boolean;
  fix: boolean;
  guard: boolean;
  bigv: number;
  pin: boolean;
  onboarded: boolean;
};

/* ───────────── Helpers ───────────── */
export const MES = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];
export const DIA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const p2 = (n: number) => (n < 10 ? "0" : "") + n;
export const iso = (d: Date) =>
  `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
export const ago = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return iso(d);
};
export const parseISO = (s: string) => new Date(s + "T12:00:00");
export const isoValid = (s: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(parseISO(s).getTime());
export const fdl = (s: string) => {
  if (s === ago(0)) return "Hoje";
  if (s === ago(1)) return "Ontem";
  const [y, m, d] = s.split("-").map(Number);
  return `${d} ${MES[m - 1]}${y !== new Date().getFullYear() ? " " + y : ""}`;
};
export const stLbl = (s: string) =>
  s === ago(0)
    ? "Hoje"
    : s === ago(1)
      ? "Ontem"
      : `${DIA[parseISO(s).getDay()]} ${parseISO(s).getDate()}`;
export const kz = (n: number) =>
  Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " Kz";
export const kmt = (v: number) =>
  v >= 1e6
    ? (+(v / 1e6).toFixed(1) + "").replace(".", ",") + " M"
    : v >= 1e3
      ? (+(v / 1e3).toFixed(1) + "").replace(".", ",") + " mil"
      : Math.round(v) + "";
export const num = (s: string) =>
  parseFloat(String(s).replace(/\s/g, "").replace(",", ".")) || 0;
export const pct = (a: number, b: number) =>
  b > 0 ? Math.min(100, Math.round((a / b) * 100)) : 0;
export const nz = (s: string) =>
  String(s)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
export const ntT = (ts: number) => {
  const s = (Date.now() - ts) / 1000;
  if (s < 45) return "agora";
  if (s < 3600) return `há ${Math.round(s / 60)} min`;
  if (s < 86400) return `há ${Math.round(s / 3600)} h`;
  const d = Math.round(s / 86400);
  return d === 1 ? "ontem" : `há ${d} dias`;
};

/* ───────────── Navegação ───────────── */
export const go = (path: string) => router.push(path as never);
export const goBack = () =>
  router.canGoBack() ? router.back() : router.replace("/" as never);

/* ───────────── Categorias e ícones ───────────── */
export const CAT: Record<string, { icon: string; color: string }> = {
  Comida: { icon: "food", color: "#f08a3c" },
  Casa: { icon: "home", color: "#4d8bf0" },
  Serviços: { icon: "bolt", color: "#d9a514" },
  Transporte: { icon: "car", color: "#2fb5a3" },
  Lazer: { icon: "star", color: "#e0569a" },
  Saúde: { icon: "heart", color: "#e2574c" },
  Salário: { icon: "wallet", color: "#1f9d57" },
  Extra: { icon: "plus", color: "#1f9d57" },
  Outros: { icon: "more", color: "#8d8d8d" },
};
// [2026-11-10] Versão anterior mantida como referência:
// export const CK = {
//   d: ["Comida", "Casa", "Serviços", "Transporte", "Lazer", "Saúde", "Outros"],
//   r: ["Salário", "Extra", "Outros"],
// };

export const CK = {
  // Despesas
  d: [
    "Comida", // mercado, cesta básica, restaurantes
    "Casa", // renda, condomínio, manutenção
    "Água e Luz", // EPAL, ENDE/EDEL, gerador, combustível
    "Telefone e Internet", // Unitel, Africell, dados móveis, Zap/DStv
    "Transporte", // táxi, candongueiro, moto-táxi, combustível
    "Educação", // propinas, material escolar, explicações
    "Saúde", // consultas, farmácia, seguro
    "Família", // ajuda a familiares, mesada, apoio
    "Lazer", // saídas, festas, streaming
    "Vestuário", // roupa, calçado, cabeleireiro
    "Dívidas e Poupança", // empréstimos, kixikila, prestações
    "Igreja e Doações", // dízimo, ofertas, solidariedade
    "Taxas e Impostos", // taxas bancárias, Multicaixa, licenças
    "Outros",
  ],

  // Receitas
  r: [
    "Salário",
    "Subsídios", // férias, Natal, transporte, alimentação
    "Negócio / Vendas", // comércio, loja, zunga
    "Biscates / Extra", // trabalhos pontuais, freelancing
    "Rendas", // arrendamento de imóveis
    "Remessas", // dinheiro enviado por familiares
    "Kixikila / Poupança", // resgate de poupança colectiva
    "Outros",
  ],
};

type IconName = ComponentProps<typeof Feather>["name"];
export const ICON: Record<string, IconName> = {
  home: "home",
  list: "list",
  goal: "target",
  stat: "bar-chart-2",
  chart: "bar-chart-2",
  set: "settings",
  tune: "sliders",
  plus: "plus",
  minus: "minus",
  debt: "credit-card",
  proj: "layers",
  fix: "calendar",
  cal: "calendar",
  back: "chevron-left",
  menu: "menu",
  more: "more-horizontal",
  bell: "bell",
  food: "coffee",
  bolt: "zap",
  car: "truck",
  star: "star",
  heart: "heart",
  wallet: "dollar-sign",
  search: "search",
  lock: "lock",
  warn: "alert-triangle",
  stop: "slash",
  coin: "dollar-sign",
  ok: "check",
  x: "x",
  mov: "repeat",
  shield: "shield",
  chev: "chevron-right",
};

export const NK: Record<NotifKind, { color: string; level: number }> = {
  danger: { color: "#e2574c", level: 3 },
  warn: { color: "#d9a514", level: 2 },
  info: { color: "#4d8bf0", level: 1 },
  ok: { color: "#1f9d57", level: 0 },
};

/* ───────────── Configuração (perfis, módulos, formulários) ───────────── */
export const MODULOS: { k: ModKey; t: string; d: string }[] = [
  { k: "salario", t: "Salário", d: "Cartão do próximo salário" },
  { k: "metas", t: "Metas e poupanças", d: "Objetivos de poupança" },
  { k: "dividas", t: "Dívidas", d: "Valores a pagar" },
  { k: "projetos", t: "Projetos", d: "Orçamento por projeto" },
  { k: "fixas", t: "Despesas fixas", d: "Contas mensais" },
  { k: "limite", t: "Limite diário", d: "Gasto máximo por dia" },
];

export const PERFIS: Record<
  Exclude<Perfil, "Personalizado">,
  Record<ModKey, boolean>
> = {
  Estudante: {
    salario: false,
    metas: true,
    dividas: false,
    projetos: false,
    fixas: true,
    limite: true,
  },
  Trabalhador: {
    salario: true,
    metas: true,
    dividas: true,
    projetos: false,
    fixas: true,
    limite: true,
  },
  Freelancer: {
    salario: true,
    metas: true,
    dividas: true,
    projetos: true,
    fixas: true,
    limite: false,
  },
  Empresario: {
    salario: false,
    metas: true,
    dividas: true,
    projetos: true,
    fixas: true,
    limite: false,
  },
};

export const ALERTAS: {
  k: "push" | "t80" | "t100" | "big" | "fix" | "guard";
  t: string;
  d: (s: State) => string;
}[] = [
  {
    k: "push",
    t: "Notificações push",
    d: () => "Mostra os alertas como push no ecrã",
  },
  {
    k: "t80",
    t: "Aviso aos 80%",
    d: () => "Alerta quando usares 80% do limite",
  },
  {
    k: "t100",
    t: "Limite atingido",
    d: () => "Alerta ao chegar ou passar o limite",
  },
  {
    k: "big",
    t: "Gastos grandes",
    d: (s) => `Avisa em compras acima de ${kz(s.bigv)}`,
  },
  {
    k: "fix",
    t: "Contas a vencer",
    d: () => "Dívidas e despesas fixas próximas",
  },
  {
    k: "guard",
    t: "Travão de segurança",
    d: () => "Pede confirmação antes de passar o limite",
  },
];

export const ITEM_FORMS: Record<
  ItemTipo,
  { titulo: string; botao: string; campos: { l: string; num: boolean }[] }
> = {
  metas: {
    titulo: "Nova meta",
    botao: "+ Nova meta",
    campos: [
      { l: "Nome da meta", num: false },
      { l: "Valor da meta (Kz)", num: true },
      { l: "Já poupado (Kz)", num: true },
    ],
  },
  dividas: {
    titulo: "Nova dívida",
    botao: "+ Nova dívida",
    campos: [
      { l: "Credor", num: false },
      { l: "Valor em dívida (Kz)", num: true },
      { l: "Vence a (ex.: 30 Dez)", num: false },
    ],
  },
  projetos: {
    titulo: "Novo projeto",
    botao: "+ Novo projeto",
    campos: [
      { l: "Nome do projeto", num: false },
      { l: "Orçamento (Kz)", num: true },
      { l: "Já gasto (Kz)", num: true },
    ],
  },
  fixas: {
    titulo: "Nova conta fixa",
    botao: "+ Nova conta fixa",
    campos: [
      { l: "Nome da conta", num: false },
      { l: "Valor mensal (Kz)", num: true },
      { l: "Dia do mês (1-31)", num: true },
    ],
  },
};

/* ───────────── Dados de exemplo ───────────── */
let _id = 100;
const uid = (p: string) => `${p}${++_id}`;

const SAMPLE_MOVS: Mov[] = [
  { id: "m1", t: "Almoço", c: "Comida", v: -4500, dt: ago(0) },
  { id: "m2", t: "Salário de novembro", c: "Salário", v: 350000, dt: ago(1) },
  { id: "m3", t: "Internet", c: "Serviços", v: -15000, dt: ago(2) },
  { id: "m4", t: "Táxi", c: "Transporte", v: -2500, dt: ago(2) },
  { id: "m5", t: "Supermercado", c: "Comida", v: -38500, dt: ago(3) },
  { id: "m6", t: "Mercado da rua", c: "Comida", v: -12000, dt: ago(3) },
  { id: "m7", t: "Trabalho extra", c: "Extra", v: 80000, dt: ago(4) },
  { id: "m8", t: "Renda da casa", c: "Casa", v: -120000, dt: ago(5) },
];
const SAMPLE_METAS: Meta[] = [
  { id: "g1", nome: "Fundo de emergência", atual: 240000, alvo: 600000 },
  { id: "g2", nome: "Viagem a Luanda", atual: 90000, alvo: 300000 },
  { id: "g3", nome: "Portátil novo", atual: 310000, alvo: 450000 },
];
const SAMPLE_DIVIDAS: Divida[] = [
  { id: "d1", nome: "Empréstimo (Carlos)", valor: 50000, vence: "20 Nov" },
  { id: "d2", nome: "Cartão da loja", valor: 35000, vence: "15 Dez" },
];
const SAMPLE_PROJETOS: Projeto[] = [
  { id: "p1", nome: "Obra da casa", gasto: 310000, orcamento: 800000 },
  { id: "p2", nome: "Curso de inglês", gasto: 45000, orcamento: 90000 },
];
const SAMPLE_FIXAS: Fixa[] = [
  { id: "f1", nome: "Renda", valor: 120000, dia: 1 },
  { id: "f2", nome: "Internet", valor: 15000, dia: 10 },
  { id: "f3", nome: "Electricidade", valor: 12000, dia: 15 },
];

const mk = (
  k: NotifKind,
  i: string,
  t: string,
  b: string,
  ts = Date.now(),
  read = false,
): Notif => ({ id: uid("n"), k, i, t, b, ts, read });

function sampleNotifs(): Notif[] {
  const n = Date.now();
  const g = SAMPLE_METAS[2];
  return [
    mk(
      "info",
      "cal",
      "Conta a vencer",
      "Empréstimo (Carlos) vence a 20 Nov — 50 000 Kz.",
      n - 35 * 6e4,
    ),
    mk(
      "ok",
      "goal",
      "Meta a avançar",
      `${g.nome} já está a ${pct(g.atual, g.alvo)}%. Faltam ${kz(g.alvo - g.atual)}.`,
      n - 5 * 36e5,
    ),
    mk(
      "ok",
      "plus",
      "Salário recebido",
      "350 000 Kz entraram na tua conta.",
      n - 26 * 36e5,
    ),
    mk(
      "warn",
      "cal",
      "Internet vence dia 10",
      "15 000 Kz serão debitados em breve.",
      n - 2 * 864e5,
      true,
    ),
  ];
}

function initial(): State {
  const S = USE_SAMPLE_DATA;
  return {
    name: "Aquiles",
    base: S ? 412500 : 0,
    hid: false,
    theme: "system",
    prof: "Personalizado",
    mod: {
      salario: true,
      metas: true,
      dividas: true,
      projetos: true,
      fixas: true,
      limite: true,
    },
    movs: S ? SAMPLE_MOVS : [],
    metas: S ? SAMPLE_METAS : [],
    dividas: S ? SAMPLE_DIVIDAS : [],
    projetos: S ? SAMPLE_PROJETOS : [],
    fixas: S ? SAMPLE_FIXAS : [],
    notifs: S ? sampleNotifs() : [],
    lim: 20000,
    push: true,
    t80: true,
    t100: true,
    big: true,
    fix: true,
    guard: true,
    bigv: 10000,
    pin: false,
    onboarded: !S, // com dados de exemplo mostra o onboarding na primeira abertura
  };
}

/* ───────────── Store em memória ───────────── */
let state: State = initial();
const listeners = new Set<() => void>();
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
export const getState = () => state;
export function setState(
  patch: Partial<State> | ((s: State) => Partial<State>),
) {
  state = { ...state, ...(typeof patch === "function" ? patch(state) : patch) };
  listeners.forEach((l) => l());
}
export const useStore = () =>
  useSyncExternalStore(subscribe, getState, getState);

/* ───────────── Seletores ───────────── */
export const balance = (s: State) => s.movs.reduce((a, m) => a + m.v, s.base);
export const sumMovs = (s: State, f: (m: Mov) => boolean) =>
  s.movs.filter(f).reduce((a, m) => a + m.v, 0);
export const spentOf = (movs: Mov[]) =>
  -movs.filter((m) => m.v < 0 && m.dt === ago(0)).reduce((a, m) => a + m.v, 0);
export const spentToday = (s: State) => spentOf(s.movs);
export const unreadCount = (s: State) => s.notifs.filter((n) => !n.read).length;
export function nextDue(s: State): { nome: string; dias: number } | null {
  const hoje = new Date().getDate();
  let b: { nome: string; dias: number } | null = null;
  s.fixas.forEach((f) => {
    let n = f.dia - hoje;
    if (n < 0) n += 30;
    if (!b || n < b.dias) b = { nome: f.nome, dias: n };
  });
  return b;
}
/** Devolve info do travão se este gasto ultrapassar o limite diário. */
export function checkGuard(v: number): { pre: number; excede: number } | null {
  const s = state;
  const pre = spentToday(s);
  return s.guard && pre + v > s.lim ? { pre, excede: pre + v - s.lim } : null;
}

function ntCheck(s: State, pre: number, a: number, m: { t: string }): Notif[] {
  const L = s.lim,
    v = a - pre,
    o: Notif[] = [];
  if (s.big && v >= s.bigv)
    o.push(
      mk(
        "warn",
        "coin",
        "Gasto elevado",
        `Gastaste ${kz(v)} em ${m.t}. Foi planeado?`,
      ),
    );
  if (s.t100 && a >= L && pre < L)
    o.push(
      mk(
        "danger",
        "stop",
        "Limite diário atingido",
        `Chegaste a ${kz(a)} de ${kz(L)}. Evita novos gastos hoje.`,
      ),
    );
  else if (s.t100 && a > L && pre >= L)
    o.push(
      mk(
        "danger",
        "stop",
        "Acima do limite",
        `Já vais ${kz(a - L)} acima do limite de hoje.`,
      ),
    );
  else if (s.t80 && a >= L * 0.8 && pre < L * 0.8)
    o.push(
      mk(
        "warn",
        "warn",
        "Quase no limite",
        `Já usaste ${pct(a, L)}% do limite diário. Restam ${kz(Math.max(0, L - a))}.`,
      ),
    );
  return o;
}

/* ───────────── Ações ───────────── */
export const A = {
  toggleHid: () => {
    setSetting("hide_amounts", getSetting("hide_amounts") === "1" ? "0" : "1");
    bumpDataVersion();
  },
  setName: (name: string) => setState((s) => ({ name: name.trim() || s.name })),
  setTheme: (theme: ThemePref) => {
    setSetting("theme_preference", theme);
    bumpDataVersion();
  },
  toggleMod: (k: ModKey) =>
    setState((s) => ({
      mod: { ...s.mod, [k]: !s.mod[k] },
      prof: "Personalizado",
    })),
  toggleFlag: (k: "push" | "t80" | "t100" | "big" | "fix" | "guard" | "pin") =>
    setState((s) => ({ [k]: !s[k] }) as Partial<State>),
  setLimite: (delta: number) =>
    setState((s) => ({ lim: Math.max(2000, Math.min(500000, s.lim + delta)) })),
  applyPerfil: (p: Perfil) =>
    setState((s) => ({
      prof: p,
      mod: p === "Personalizado" ? s.mod : { ...PERFIS[p] },
    })),

  addMov: (m: Omit<Mov, "id">) =>
    setState((s) => {
      const pre = spentOf(s.movs);
      const movs = [{ ...m, id: uid("m") }, ...s.movs];
      const novas =
        m.v < 0 && spentOf(movs) > pre ? ntCheck(s, pre, spentOf(movs), m) : [];
      return { movs, notifs: [...novas, ...s.notifs] };
    }),
  updateMov: (id: string, patch: Partial<Omit<Mov, "id">>) =>
    setState((s) => ({
      movs: s.movs.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    })),
  removeMov: (id: string) =>
    setState((s) => ({ movs: s.movs.filter((m) => m.id !== id) })),

  addItem: (tipo: ItemTipo, v: string[]) =>
    setState((s) => {
      if (tipo === "metas")
        return {
          metas: [
            ...s.metas,
            {
              id: uid("g"),
              nome: v[0] || "Nova meta",
              alvo: num(v[1]) || 1,
              atual: num(v[2]),
            },
          ],
        };
      if (tipo === "dividas")
        return {
          dividas: [
            ...s.dividas,
            {
              id: uid("d"),
              nome: v[0] || "Dívida",
              valor: num(v[1]),
              vence: v[2] || "—",
            },
          ],
        };
      if (tipo === "projetos")
        return {
          projetos: [
            ...s.projetos,
            {
              id: uid("p"),
              nome: v[0] || "Projeto",
              orcamento: num(v[1]) || 1,
              gasto: num(v[2]),
            },
          ],
        };
      return {
        fixas: [
          ...s.fixas,
          {
            id: uid("f"),
            nome: v[0] || "Conta",
            valor: num(v[1]),
            dia: Math.min(31, Math.max(1, num(v[2]) || 1)),
          },
        ],
      };
    }),

  markAllRead: () =>
    setState((s) => ({ notifs: s.notifs.map((n) => ({ ...n, read: true })) })),
  toggleRead: (id: string) =>
    setState((s) => ({
      notifs: s.notifs.map((n) => (n.id === id ? { ...n, read: !n.read } : n)),
    })),

  finishOnboarding: (o: {
    name: string;
    estudante: boolean;
    temRenda: boolean | null;
    valor: string;
    pin: boolean;
  }) =>
    setState((s) => {
      const a = num(o.valor);
      const mod = o.estudante
        ? { ...PERFIS.Estudante }
        : { ...PERFIS.Trabalhador, salario: !!o.temRenda };
      const novo: Mov | null =
        o.temRenda && a > 0
          ? {
              id: uid("m"),
              t: o.estudante ? "Mesada" : "Salário",
              c: o.estudante ? "Extra" : "Salário",
              v: a,
              dt: ago(0),
            }
          : null;
      return {
        name: o.name.trim() || s.name,
        prof: o.estudante ? "Estudante" : "Trabalhador",
        mod,
        pin: o.pin, // integra aqui com o teu fluxo de PIN real
        movs: novo ? [novo, ...s.movs] : s.movs,
        onboarded: true,
      };
    }),
};

/* ───────────── Tema ───────────── */
export const FONT = {
  // A app carrega DMSans no layout raiz; manter a mesma família evita
  // fallback silencioso para a fonte do sistema nestes ecrãs.
  reg: "DMSans_400Regular",
  med: "DMSans_500Medium",
  semi: "DMSans_700Bold",
};
// Se a fonte não estiver carregada (useFonts), o RN usa a fonte do sistema.

// Os ecrãs legados ainda consomem esta forma curta de tema. Os valores vêm do
// mesmo design system de `src/ui/theme`, evitando duas paletas divergentes.
const toLegacyTheme = (colors: typeof lightColors) => ({
  bg: colors.bg,
  panel: colors.bgMid,
  text: colors.text,
  muted: colors.textMuted,
  circ: colors.iconTileBg,
  acc: colors.accent,
  amb: colors.warn,
  hbtn: colors.bgMid,
  ring: colors.hairline,
  neg: colors.danger,
  pos: colors.success,
  add: colors.avatarBg,
  addc: colors.avatarText,
  addp: colors.avatarBg,
  av: colors.avatarBg,
  avTxt: colors.avatarText,
});
const LIGHT = toLegacyTheme(lightColors);
const DARK = toLegacyTheme(darkColors);
export type Theme = typeof LIGHT;

export function useTheme() {
  const preferences = useAppPreferences();
  const sys = useColorScheme();
  const theme = preferences.theme;
  const dark = theme === "system" ? sys === "dark" : theme === "dark";
  const st = {
    theme,
    hid: preferences.hideAmounts,
    name: getSetting("user_name") ?? "",
  } as Pick<State, "theme" | "hid" | "name">;
  const t = dark ? DARK : LIGHT;
  const s = useMemo(() => makeStyles(t), [dark]); // eslint-disable-line react-hooks/exhaustive-deps
  return { t, s, st, dark };
}

export function makeStyles(t: Theme) {
  const F = FONT;
  const tx = (size: number, fam: string, color: string = t.text) => ({
    fontSize: size,
    fontFamily: fam,
    color,
  });
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: t.bg },
    content: { paddingHorizontal: 16, paddingBottom: 132 },
    top: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    rt: { flexDirection: "row", gap: 7 },
    circ: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: t.hbtn,
      alignItems: "center",
      justifyContent: "center",
    },
    circSm: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    circQ: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: t.circ,
      alignItems: "center",
      justifyContent: "center",
    },
    av: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: t.av,
      alignItems: "center",
      justifyContent: "center",
    },
    avBig: { width: 72, height: 72, borderRadius: 36 },
    avTxt: tx(16, F.semi, t.avTxt),
    badge: {
      position: "absolute",
      top: -3,
      right: -3,
      minWidth: 19,
      height: 19,
      borderRadius: 10,
      backgroundColor: t.neg,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 5,
    },
    badgeTxt: tx(10, F.semi, "#fff"),
    h1: {
      ...tx(27, F.med),
      lineHeight: 34,
      letterSpacing: -0.4,
      marginTop: 16,
    },
    sub: { ...tx(13, F.reg, t.muted), marginTop: 4 },
    note: { ...tx(10, F.reg, t.muted), textAlign: "center", marginTop: 16 },
    panel: {
      backgroundColor: t.panel,
      borderRadius: 20,
      paddingVertical: 18,
      paddingHorizontal: 14,
      marginTop: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.ring,
    },
    eh: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 6,
    },
    ehTxt: tx(14, F.med),
    link: tx(12, F.med, t.acc),
    gs: { ...tx(10, F.reg, t.muted), marginTop: 1 },
    it: {
      flexDirection: "row",
      alignItems: "center",
      gap: 11,
      minHeight: 54,
      paddingVertical: 6,
      paddingHorizontal: 4,
    },
    itBody: { flex: 1 },
    itTxt: tx(13, F.med),
    itSub: tx(10, F.reg, t.muted),
    pTxt: { ...tx(13, F.med) },
    pos: { color: t.pos },
    neg: { color: t.neg },
    row: { paddingVertical: 10, paddingHorizontal: 4 },
    rowH: { flexDirection: "row", justifyContent: "space-between" },
    rowTxt: tx(13, F.med),
    rowSub: tx(10, F.reg, t.muted),
    bar: {
      height: 8,
      borderRadius: 8,
      backgroundColor: t.circ,
      marginTop: 6,
      overflow: "hidden",
    },
    barFill: { height: "100%", borderRadius: 8, backgroundColor: t.acc },
    empty: { alignItems: "center", paddingVertical: 26, paddingHorizontal: 10 },
    emptyTxt: { ...tx(12, F.reg, t.muted), textAlign: "center" },
    emptyBtn: {
      marginTop: 12,
      backgroundColor: t.acc,
      paddingVertical: 9,
      paddingHorizontal: 18,
      borderRadius: 99,
    },
    emptyBtnTxt: tx(12, F.reg, "#fff"),
    tg: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 12,
      paddingHorizontal: 4,
    },
    tgTxt: tx(13, F.reg),
    tgSub: tx(10, F.reg, t.muted),
    seg: {
      flexDirection: "row",
      backgroundColor: t.circ,
      borderRadius: 99,
      padding: 3,
      gap: 3,
    },
    segBtn: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 99,
      alignItems: "center",
    },
    segBtnOn: { backgroundColor: t.acc },
    segTxt: tx(12, F.reg, t.muted),
    segTxtOn: { color: "#fff" },
    back: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 4,
    },
    backTxt: { ...tx(20, F.med), flex: 1 },
    go: {
      height: 50,
      marginTop: 18,
      borderRadius: 25,
      backgroundColor: t.acc,
      alignItems: "center",
      justifyContent: "center",
    },
    goTxt: tx(14, F.med, "#fff"),
    goGhost: { backgroundColor: t.circ },
    input: {
      borderBottomWidth: 1.5,
      borderBottomColor: t.ring,
      ...tx(16, F.med),
      paddingVertical: 10,
      marginTop: 10,
    },
    inputBox: {
      backgroundColor: t.panel,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginTop: 10,
      ...tx(15, F.med),
    },
    fl: { ...tx(11, F.reg, t.muted), marginTop: 16 },
    chips: { gap: 6, paddingVertical: 2, paddingRight: 8 },
    chip: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 99,
      backgroundColor: t.circ,
    },
    chipOn: { backgroundColor: t.acc },
    chipTxt: tx(11, F.reg, t.muted),
    chipTxtOn: { color: "#fff" },
    hs: {
      backgroundColor: t.acc,
      borderRadius: 26,
      paddingTop: 18,
      paddingHorizontal: 18,
      paddingBottom: 16,
      marginTop: 16,
    },
    hsL: { ...tx(11, F.reg, "#fff"), opacity: 0.85 },
    hsR: { ...tx(30, F.med, "#fff"), lineHeight: 42, letterSpacing: -0.6 },
    hsPb: {
      height: 6,
      borderRadius: 6,
      backgroundColor: "#ffffff33",
      marginTop: 12,
      overflow: "hidden",
    },
    hsPbI: { height: "100%", backgroundColor: t.amb, borderRadius: 6 },
    io: { flexDirection: "row", gap: 10, marginTop: 12 },
    ioBox: {
      flex: 1,
      backgroundColor: "#ffffff22",
      borderRadius: 16,
      paddingVertical: 9,
      paddingHorizontal: 12,
    },
    ioL: tx(11, F.reg, "#fff"),
    ioB: { ...tx(14, F.med, "#fff"), marginTop: 2 },
    alr: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginTop: 14,
      paddingVertical: 11,
      paddingHorizontal: 14,
      borderRadius: 18,
      backgroundColor: t.panel,
    },
    alrDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: t.amb },
    alrTxt: { ...tx(12, F.reg), flex: 1 },
    srch: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: t.circ,
      borderRadius: 99,
      paddingHorizontal: 14,
      height: 46,
    },
    srchIn: { ...tx(13, F.reg), flex: 1, padding: 0 },
    ftg: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 10,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 99,
      backgroundColor: t.circ,
    },
    ftgB: {
      backgroundColor: t.acc,
      borderRadius: 99,
      minWidth: 18,
      height: 18,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 5,
    },
    quick: {
      flexDirection: "row",
      justifyContent: "space-around",
      paddingHorizontal: 4,
    },
    q: { alignItems: "center", gap: 8 },
    qTxt: tx(11, F.reg),
    // cartão principal
    sal: {
      backgroundColor: t.amb,
      borderRadius: 24,
      height: 100,
      paddingTop: 20,
      paddingHorizontal: 16,
      flexDirection: "row",
      justifyContent: "space-between",
    },
    salTxt: tx(14, F.reg, "#111"),
    // Mantidos para a marcação antiga desativada durante a migração do cartão.
    mainL: { ...tx(12, F.reg, "#fff"), opacity: 0.85 },
    big: { ...tx(33, F.med, "#fff"), lineHeight: 44, letterSpacing: -0.6 },
    add: {
      position: "absolute",
      right: 0,
      bottom: 0,
      width: 120,
      height: 50,
      borderRadius: 25,
      backgroundColor: t.add,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingLeft: 9,
    },
    addPlus: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: t.addc,
      alignItems: "center",
      justifyContent: "center",
    },
    addTxt: tx(13, F.med, "#fff"),
    // estatísticas
    stg: { flexDirection: "row", gap: 8, marginTop: 12 },
    stgBox: {
      flex: 1,
      backgroundColor: t.circ,
      borderRadius: 16,
      paddingVertical: 9,
      paddingHorizontal: 10,
    },
    // notificações
    ni: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 11,
      paddingVertical: 12,
      paddingHorizontal: 10,
      borderRadius: 18,
      marginTop: 4,
    },
    niUn: { backgroundColor: t.circ },
    // dc (caixas de resultado / detalhe)
    dg: {
      backgroundColor: t.circ,
      borderRadius: 18,
      paddingVertical: 12,
      paddingHorizontal: 14,
    },
    oc: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      backgroundColor: t.panel,
      borderRadius: 22,
      padding: 16,
      marginTop: 12,
      borderWidth: 2,
      borderColor: "transparent",
    },
    ocOn: { borderColor: t.acc },
    okc: {
      width: 96,
      height: 96,
      borderRadius: 30,
      backgroundColor: t.acc,
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "center",
      marginBottom: 22,
    },
  });
}
