export function formatKz(value: number): string {
  const rounded = Math.round(value);
  const sign = rounded < 0 ? '-' : '';
  const digits = Math.abs(rounded).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${sign}${digits} Kz`;
}

export function formatKzNumber(value: number): string {
  const rounded = Math.round(value);
  const sign = rounded < 0 ? '-' : '';
  const digits = Math.abs(rounded).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${sign}${digits}`;
}
