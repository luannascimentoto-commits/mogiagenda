import { describe, it, expect } from 'vitest'
import { serviceSchema } from './schema'

describe('serviceSchema', () => {
  const valid = {
    name: 'Massagem',
    description: 'Relaxante',
    duration: '60',
    price: '150,00',
    is_active: true,
  }

  it('aceita dados válidos', () => {
    expect(serviceSchema.safeParse(valid).success).toBe(true)
  })

  it('rejeita nome curto', () => {
    const r = serviceSchema.safeParse({ ...valid, name: 'A' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.issues[0].message).toMatch(/mínimo 2 letras/)
  })

  it('rejeita nome longo', () => {
    const r = serviceSchema.safeParse({ ...valid, name: 'a'.repeat(81) })
    expect(r.success).toBe(false)
  })

  it('rejeita descrição longa', () => {
    const r = serviceSchema.safeParse({ ...valid, description: 'a'.repeat(301) })
    expect(r.success).toBe(false)
  })

  it('rejeita duração vazia', () => {
    const r = serviceSchema.safeParse({ ...valid, duration: '' })
    expect(r.success).toBe(false)
  })

  it('rejeita preço inválido', () => {
    const r = serviceSchema.safeParse({ ...valid, price: 'abc' })
    expect(r.success).toBe(false)
  })

  it('aceita preço vazio (sem valor)', () => {
    const r = serviceSchema.safeParse({ ...valid, price: '' })
    expect(r.success).toBe(true)
  })
})