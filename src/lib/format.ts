/** Mostra centavos como moeda brasileira. Sem valor => traço. */
export function formatPrice(cents: number | null): string {
  if (cents === null) return '—'
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h} h` : `${h} h ${m} min`
}

/** Centavos => texto para o campo do formulário (ex.: 15000 => "150,00"). */
export function priceToInput(cents: number | null): string {
  return cents === null ? '' : (cents / 100).toFixed(2).replace('.', ',')
}

export type PriceParse = { ok: true; cents: number | null } | { ok: false }

/**
 * Converte o que a pessoa digitou em centavos.
 * Aceita "150", "150,5", "150,00", "R$ 1.500,00". Vazio => sem valor (null).
 */
export function parsePrice(text: string): PriceParse {
  const cleaned = text.replace(/R\$/gi, '').replace(/\s/g, '')
  if (cleaned === '') return { ok: true, cents: null }

  const normalized = cleaned.includes(',') ? cleaned.replace(/\./g, '').replace(',', '.') : cleaned
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return { ok: false }

  const cents = Math.round(parseFloat(normalized) * 100)
  if (cents > 100_000_000) return { ok: false } // limite de R$ 1.000.000,00
  return { ok: true, cents }
}
