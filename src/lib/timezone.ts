/** Converte "YYYY-MM-DDTHH:mm" no fuso informado para ISO UTC. */
export function localToUtcIso(local: string, timeZone: string): string {
  const [datePart, timePart] = local.split('T')
  const [y, m, d] = datePart.split('-').map(Number)
  const [hh, mm] = (timePart || '00:00').split(':').map(Number)
  const naive = new Date(Date.UTC(y, m - 1, d, hh, mm))
  // offset do fuso em relação ao UTC para essa data
  const utcStr = naive.toLocaleString('en-US', { timeZone: 'UTC' })
  const tzStr = naive.toLocaleString('en-US', { timeZone })
  const offset = new Date(tzStr).getTime() - new Date(utcStr).getTime()
  return new Date(naive.getTime() - offset).toISOString()
}

/** Converte ISO UTC para "YYYY-MM-DDTHH:mm" no fuso informado. */
export function utcToLocalInput(iso: string, timeZone: string): string {
  const d = new Date(iso)
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`
}

export function formatDateTime(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone,
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(iso))
}