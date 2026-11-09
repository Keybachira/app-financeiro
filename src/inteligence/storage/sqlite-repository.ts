import type {
  BehaviorProfile,
  IntelligenceRepository,
  MovementInput,
} from "../types/intelligence.types";

/**
 * Subconjunto estrutural da API síncrona do expo-sqlite. A app usa
 * `openDatabaseSync`, por isso o motor lê os dados sem duplicar a base.
 */
type SqlParam = string | number | null;

export interface SqlDb {
  getAllSync<T>(sql: string, params: SqlParam[]): T[];
  getFirstSync<T>(sql: string, params: SqlParam[]): T | null;
  runSync(sql: string, params: SqlParam[]): unknown;
}

const PROFILE_KEY = "intelligence_profile";

/**
 * Lê `movements` (só leitura) e guarda o perfil como JSON na tabela `settings`
 * existente: não precisa de migração nem de tabelas novas, e o backup
 * JSON/CSV continua a funcionar.
 */
export function createSqliteRepository(db: SqlDb): IntelligenceRepository {
  return {
    async loadMovements(since) {
      const rows = db.getAllSync<{
        id: string;
        type: "income" | "expense";
        amount: number;
        category: string;
        date: string;
        note: string | null;
        bill_id: string | null;
        origin: string;
      }>(
        "SELECT id, type, amount, category, date, note, bill_id, origin FROM movements WHERE date >= ? ORDER BY date ASC",
        [since],
      );

      return rows.map(
        (r): MovementInput => ({
          id: r.id,
          type: r.type,
          amount: r.amount,
          category: r.category,
          date: r.date,
          note: r.note,
          // Movimentos antigos de contas fixas podem não ter `bill_id`; o
          // `origin` evita que a inteligência os trate como despesas recorrentes.
          billId:
            r.bill_id ?? (r.origin === "bill" ? "legacy-bill" : null),
        }),
      );
    },

    async loadProfile() {
      const row = db.getFirstSync<{ value: string }>(
        "SELECT value FROM settings WHERE key = ?",
        [PROFILE_KEY],
      );
      return row ? row.value : null;
    },

    async saveProfile(profile: BehaviorProfile) {
      db.runSync(
        "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
        [PROFILE_KEY, JSON.stringify(profile)],
      );
    },
  };
}
