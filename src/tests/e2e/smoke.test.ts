import { test, expect } from "@playwright/test";

test("não autenticado acessando /dashboard é redirecionado para /entrar", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/entrar/);
});

test("página inicial é uma landing pública (não exige login)", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL("/");
  await expect(page).toHaveTitle(/SecJessica/);
  await expect(page.locator("h1")).toContainText(/secretária/);
});

test("página de login exibe SecJessica", async ({ page }) => {
  await page.goto("/entrar");
  await expect(page).toHaveTitle(/SecJessica/);
  await expect(page.locator("text=Bem-vindo de volta")).toBeVisible();
});
