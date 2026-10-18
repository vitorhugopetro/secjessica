import { test, expect } from "@playwright/test";

const sidebarLinks = [
  { href: "/dashboard", label: "Painel" },
  { href: "/empresas", label: "Empresas" },
  { href: "/onboarding", label: "Nova Empresa" },
  { href: "/clientes", label: "Clientes" },
  { href: "/contatos", label: "Contatos" },
  { href: "/agenda", label: "Agenda" },
  { href: "/whatsapp", label: "WhatsApp" },
  { href: "/agenda/google", label: "Google Agenda" },
  { href: "/tarefas", label: "Tarefas" },
  { href: "/comunicacao", label: "Comunicação" },
  { href: "/relatorios", label: "Relatórios" },
  { href: "/notificacoes", label: "Notificações" },
  { href: "/ajuda", label: "Central de Ajuda" },
  { href: "/usuarios", label: "Usuários" },
  { href: "/configuracoes", label: "Configurações" },
];

const authCookie = {
  name: "secjessica:firebase_auth",
  value: JSON.stringify({ idToken: "test-token", uid: "test-user" }),
  domain: "localhost",
  path: "/",
};

test.describe("Sidebar links - Desktop", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().addCookies([authCookie]);
  });

  for (const link of sidebarLinks) {
    test(`deve acessar ${link.label} (${link.href})`, async ({ page }) => {
      await page.goto(link.href, { waitUntil: "domcontentloaded" });
      await expect(page).not.toHaveURL(/entrar/);
      await expect(page.locator("body")).not.toBeEmpty();
    });
  }
});

test.describe("Sidebar links - Mobile (Pixel 5)", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test.beforeEach(async ({ page }) => {
    await page.context().addCookies([authCookie]);
  });

  for (const link of sidebarLinks) {
    test(`deve acessar ${link.label} (${link.href})`, async ({ page }) => {
      await page.goto(link.href, { waitUntil: "domcontentloaded" });
      await expect(page).not.toHaveURL(/entrar/);
      await expect(page.locator("body")).not.toBeEmpty();
    });
  }
});
