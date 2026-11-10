import { db } from "../../db/client";
import {
  createExpoScheduler,
  createIntelligenceEngine,
  createSqliteRepository,
  systemClock,
} from "../../inteligence";

/**
 * Motor partilhado pelo arranque da app e pelo ecrã de previsões. Lê apenas
 * `movements`, guarda o perfil em `settings` e nunca cria movimentos.
 */
export const motorInteligencia = createIntelligenceEngine({
  repo: createSqliteRepository(db),
  scheduler: createExpoScheduler(),
  clock: systemClock,
});

let queue: Promise<unknown> = Promise.resolve();

/**
 * Serializa análises disparadas por edições de movimentos: duas gravações
 * seguidas não devem competir pelo mesmo perfil nem reagendar em paralelo.
 */
export function sincronizarInteligenciaAposMovimento(): void {
  queue = queue
    .then(() => motorInteligencia.onMovementsChanged())
    .catch(() => undefined);
}
