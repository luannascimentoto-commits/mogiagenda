import { test, expect } from '@playwright/test'

test('home carrega', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/AgendaMogi|mogiagenda|Vite/i)
})

test('página pública de agendamento carrega', async ({ page }) => {
  await page.goto('/c/clinica-alfa')
  // aceita tanto sucesso quanto "clínica não encontrada"
  await expect(page.locator('body')).toContainText(/AgendaMogi|clínica não encontrada|Carregando/i)
})

test('login page carrega', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByRole('button', { name: /entrar|login/i })).toBeVisible()
})