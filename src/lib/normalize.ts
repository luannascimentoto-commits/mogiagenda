/** Texto sem acentos e em minúsculas, para a busca ignorar "é" x "e". */
export function normalize(text: string) {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}