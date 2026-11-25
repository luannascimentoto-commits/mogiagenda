import { test, expect } from '@playwright/test'

const adminEmail = process.env.E2E_ADMIN_EMAIL
const adminPassword = process.env.E2E_ADMIN_PASSWORD
const receptionEmail = process.env.E2E_RECEPTION_EMAIL
const receptionPassword = process.env.E2E_RECEPTION_PASSWORD
const profEmail = process.env.E2E_PROF_EMAIL
const profPassword = process.env.E2E_PROF_PASSWORD

async function login(page: any, email: string, password: string) {
  await page.goto('/login')
  await page.getByLabel(/e-mail|email/i).fill(email)
  await page.getByLabel(/senha/i).fill(password)
  await page.getByRole('button', { name: /entrar/i }).click()
}

test('admin vê menu Clínica e Usuários', async ({ page }) => {
  test.skip(!adminEmail || !adminPassword, 'Credenciais admin não definidas')
  await login(page, adminEmail!, adminPassword!)
  await expect(page.getByText('Clínica')).toBeVisible()
  await expect(page.getByText('Usuários')).toBeVisible()
})

test('recepção não vê Clínica/Usuários mas vê Pacientes', async ({ page }) => {
  test.skip(!receptionEmail || !receptionPassword, 'Credenciais recepção não definidas')
  await login(page, receptionEmail!, receptionPassword!)
  await expect(page.getByText('Clínica')).not.toBeVisible()
  await expect(page.getByText('Usuários')).not.toBeVisible()
  await expect(page.getByText('Pacientes')).toBeVisible()
})

test('profissional não vê Clínica/Usuários/Serviços', async ({ page }) => {
  test.skip(!profEmail || !profPassword, 'Credenciais profissional não definidas')
  await login(page, profEmail!, profPassword!)
  await expect(page.getByText('Clínica')).not.toBeVisible()
  await expect(page.getByText('Usuários')).not.toBeVisible()
  await expect(page.getByText('Serviços')).not.toBeVisible()
})