import { describe, it, expect } from 'vitest'
import { normalize } from './normalize'

describe('normalize', () => {
  it('remove acentos e coloca em minúsculas', () => {
    expect(normalize('Massagem')).toBe('massagem')
    expect(normalize('Café')).toBe('cafe')
    expect(normalize('AÇÚCAR')).toBe('acucar')
  })
  it('string vazia', () => {
    expect(normalize('')).toBe('')
  })
})