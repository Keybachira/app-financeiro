import { BehaviorProfile, IntelligenceRepository, MovementInput, NotificationScheduler, Reminder } from '../types/intelligence.types';

/** Fallback de desenvolvimento e base dos testes: sem SQLite, sem Expo, sem rede. */
export function createInMemoryRepository(initial: MovementInput[] = []) {
  let movs = [...initial];
  let profile: unknown | null = null;
  const repo: IntelligenceRepository & { setMovements(m: MovementInput[]): void; rawProfile(): unknown } = {
    async loadMovements(since) { return movs.filter((m) => m.date >= since).map((m) => ({ ...m })); },
    async loadProfile() { return profile; },
    async saveProfile(p: BehaviorProfile) { profile = JSON.parse(JSON.stringify(p)); },
    setMovements(m) { movs = [...m]; },
    rawProfile() { return profile; },
  };
  return repo;
}

export function createInMemoryScheduler() {
  let scheduled: Reminder[] = [];
  const s: NotificationScheduler & { all(): Reminder[]; setRaw(p: unknown): void } = {
    async cancelAll() { scheduled = []; },
    async schedule(r) { scheduled = [...scheduled, ...r]; },
    all: () => scheduled,
    setRaw() {},
  };
  return s;
}
