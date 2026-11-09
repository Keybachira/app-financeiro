import { MovementInput, MovementType } from './types/intelligence.types';
let n = 0;
export const mov = (date: string, amount: number, note: string, category = 'Casa', type: MovementType = 'expense', billId: string | null = null): MovementInput =>
  ({ id: `m${++n}`, type, amount, category, date, note, billId });
