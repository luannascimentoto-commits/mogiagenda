import { describe, it, expect } from 'vitest'
import { formatPrice, formatDuration, priceToInput, parsePrice } from './format'

describe('formatPrice', () => {
  it('retorna traço para null', () => {
    expect(formatPrice(null)).toBe('—')
  })
  it('formata centavos como BRL', () => {
    expect(formatPrice(15000)).toMatch(/150,00/)
  })
  it('formata zero', () => {
    expect(formatPrice(0)).toMatch(/0,00/)
  })
})

describe('formatDuration', () => {
  it('minutos abaixo de 60', () => {
    expect(formatDuration(30)).toBe('30 min')
    expect(formatDuration(10)).toBe('10 min')
  })
  it('horas exatas', () => {
    expect(formatDuration(60)).toBe('1 h')
    expect(formatDuration(120)).toBe('2 h')
  })
  it('horas e minutos', () => {
    expect(formatDuration(90)).toBe('1 h 30 min')
    expect(formatDuration(75)).toBe('1 h 15 min')
  })
})

describe('priceToInput', () => {
  it('vazio para null', () => {
    expect(priceToInput(null)).toBe('')
  })
  it('converte centavos para texto', () => {
    expect(priceToInput(15000)).toBe('150,00')
    expect(priceToInput(50)).toBe('0,50')
  })
})

describe('parsePrice', () => {
  it('vazio => null ok', () => {
    expect(parsePrice('')).toEqual({ ok: true, cents: null })
    expect(parsePrice('   ')).toEqual({ ok: true, cents: null })
  })
  it('aceita formatos comuns', () => {
    expect(parsePrice('150')).toEqual({ ok: true, cents: 15000 })
    expect(parsePrice('150,5')).toEqual({ ok: true, cents: 15050 })
    expect(parsePrice('150,00')).toEqual({ ok: true, cents: 15000 })
    expect(parsePrice('R$ 1.500,00')).toEqual({ ok: true, cents: 150000 })
  })
  it('rejeita inválidos', () => {
    expect(parsePrice('abc')).toEqual({ ok: false })
    expect(parsePrice('150.999')).toEqual({ ok: false })
  })
  it('rejeita acima do limite', () => {
    expect(parsePrice('1000000,01')).toEqual({ ok: false })
  })
})