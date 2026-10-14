const ACCENTED: Record<string, string> = {
  à: 'a', á: 'a', â: 'a', ã: 'a', ä: 'a', å: 'a',
  è: 'e', é: 'e', ê: 'e', ë: 'e',
  ì: 'i', í: 'i', î: 'i', ï: 'i',
  ò: 'o', ó: 'o', ô: 'o', õ: 'o', ö: 'o', ø: 'o',
  ù: 'u', ú: 'u', û: 'u', ü: 'u',
  ç: 'c', ñ: 'n', ý: 'y', ÿ: 'y', ß: 's',
};

export function normalizeNote(note: string): string {
  return note
    .toLowerCase()
    .split('')
    .map((char) => ACCENTED[char] ?? char)
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
}

export function suggestCategory(
  note: string,
  hints: { keyword: string; category: string }[]
): string | null {
  const normalized = normalizeNote(note);

  if (normalized.length === 0) {
    return null;
  }

  let best: { keyword: string; category: string } | null = null;

  for (const hint of hints) {
    const keyword = normalizeNote(hint.keyword);

    if (keyword.length === 0 || !normalized.includes(keyword)) {
      continue;
    }

    if (best === null || keyword.length > best.keyword.length) {
      best = hint;
    }
  }

  return best?.category ?? null;
}
