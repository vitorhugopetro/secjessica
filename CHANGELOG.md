# Registro de Alterações (Changelog) — SecJessica

Todas as mudanças notáveis deste projeto serão documentadas neste arquivo.
O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/) e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

> Este arquivo é atualizado automaticamente a cada release/deploy via script `scripts/update-changelog.js` e GitHub Actions (`.github/workflows/update-changelog.yml`).

---

## [1.3.0] - 2026-10-18
### Adicionado
- **Layout Mobile Responsivo:** Sidebar colapsível com drawer lateral e menu hamburger (`md:hidden`) para telas pequenas.
- **Barra Inferior de Navegação Mobile (`MobileBottomNav`):** 5 atalhos fixos (Painel, Clientes, Agenda, WhatsApp, Configurações) visíveis apenas em dispositivos móveis.
- **PWA (Progressive Web App):** `public/manifest.json` e `public/sw.js` com cache estático de assets principais para instalação como app nativo em celulares.
- **Meta Tags Mobile:** `viewport` otimizado (`width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no`), `theme-color`, `apple-touch-icon`, `mobile-web-app-capable`, `apple-mobile-web-app-capable` e `touch-manipulation`.
- **Testes E2E de Links da Sidebar:** `src/tests/e2e/sidebar-links.test.ts` com 60 testes cobrindo todos os 15 links da sidebar em desktop e mobile (Pixel 5).

### Alterado
- **`src/app/layout.tsx`:** Adicionadas meta tags mobile, PWA e apple-touch-icon.
- **`src/components/layout/sidebar.tsx`:** Reescrito para suportar sidebar desktop fixa e drawer mobile controlado por estado (`open`/`onClose`).
- **`src/components/layout/app-shell.tsx`:** Gerencia estado do drawer mobile e renderiza `MobileBottomNav`.
- **`src/components/layout/topbar.tsx`:** Botão hamburger mobile funcional para abrir/fechar o drawer.
- **Build de Produção:** 27 rotas estáticas geradas com sucesso, TypeScript sem erros.

### Corrigido
- Testes E2E de título (`/SecJessica/` → `/Sec Jessica/`) para corresponder ao título real renderizado.
- Arquivos Firebase (`client.ts`, `server.ts`) restaurados para tipos `any` compatíveis com TypeScript strict (`useUnknownInCatchVariables`).

---

## [Em Desenvolvimento] - Atualizações recentes
*Esta seção é atualizada automaticamente a cada commit via GitHub Actions.*

### Adicionado
- feat(mobile): add responsive mobile layout, PWA, bottom nav, drawer sidebar, and sidebar E2E tests (67e5031) — Vitor Hugo Abreu de Sousa (2026-10-18)
- feat(firebase): migrate server actions and middleware from Supabase to Firebase, fix firestore rules and update build config (ac31107) — Vitor Hugo Abreu de Sousa (2026-10-18)
- fix(branding): normalize SVG logos with PNG fallback; feat(firebase): elevate Firebase Auth and Firestore as primary backend; fix(contacts): normalize import and delete signatures (b210830) — Vitor Hugo Abreu de Sousa (2026-10-17)
- feat(auth): enable Google sign-in and sign-up for Jessica and collaborators (9049dbc) — Vitor Hugo Abreu de Sousa (2026-10-17)
- feat(whatsapp): implement 10 advanced integrations, tests and multi-tenant security rules (415075a) — Vitor Hugo Abreu de Sousa (2026-10-17)
- feat: complete Sec Jessica deployment to secjessica.web.app, Firebase backend & hosting, SEO audit, and Help Center (d39d997) — Vitor Hugo Abreu de Sousa (2026-10-17)
- feat: complete SecJessica remote secretary platform with WhatsApp hub, devotional banner, and multi-tenant isolation (360e9cc) — Vitor Hugo Abreu de Sousa (2026-10-17)

### Corrigido
- fix(auth/perf): decouple Supabase profile call, fix SVG font imports, replace router.refresh with location href for static export, and update firestore rules (c8e11d2) — Vitor Hugo Abreu de Sousa (2026-10-18)
- fix(csp): add gstatic.com to connect-src for sourcemaps and assets (2c99b46) — Vitor Hugo Abreu de Sousa (2026-10-18)
- fix(auth): eliminate Supabase OAuth fallback and allow web.app in CSP frame-src (290fd75) — Vitor Hugo Abreu de Sousa (2026-10-17)
- fix(build): protect outDir cleanup against Windows folder lock (0dce384) — Vitor Hugo Abreu de Sousa (2026-10-17)
- fix(auth): implement native Firebase Google OAuth popup and update CSP headers (fda9388) — Vitor Hugo Abreu de Sousa (2026-10-17)
- fix(hosting): add Cache-Control no-cache to HTML and immutable to static chunks in firebase.json (9462d6b) — Vitor Hugo Abreu de Sousa (2026-10-17)

### Outras
- chore: record official publication address and enhance multi-tenant fallback (9076ac1) — Vitor Hugo Abreu de Sousa (2026-10-17)

### Adicionado
- feat(mobile): add responsive mobile layout, PWA, bottom nav, drawer sidebar, and sidebar E2E tests (67e5031) — Vitor Hugo Abreu de Sousa (2026-10-18)
- feat(firebase): migrate server actions and middleware from Supabase to Firebase, fix firestore rules and update build config (ac31107) — Vitor Hugo Abreu de Sousa (2026-10-18)
- fix(branding): normalize SVG logos with PNG fallback; feat(firebase): elevate Firebase Auth and Firestore as primary backend; fix(contacts): normalize import and delete signatures (b210830) — Vitor Hugo Abreu de Sousa (2026-10-17)
- feat(auth): enable Google sign-in and sign-up for Jessica and collaborators (9049dbc) — Vitor Hugo Abreu de Sousa (2026-10-17)
- feat(whatsapp): implement 10 advanced integrations, tests and multi-tenant security rules (415075a) — Vitor Hugo Abreu de Sousa (2026-10-17)
- feat: complete Sec Jessica deployment to secjessica.web.app, Firebase backend & hosting, SEO audit, and Help Center (d39d997) — Vitor Hugo Abreu de Sousa (2026-10-17)
- feat: complete SecJessica remote secretary platform with WhatsApp hub, devotional banner, and multi-tenant isolation (360e9cc) — Vitor Hugo Abreu de Sousa (2026-10-17)

### Corrigido
- fix(auth/perf): decouple Supabase profile call, fix SVG font imports, replace router.refresh with location href for static export, and update firestore rules (c8e11d2) — Vitor Hugo Abreu de Sousa (2026-10-18)
- fix(csp): add gstatic.com to connect-src for sourcemaps and assets (2c99b46) — Vitor Hugo Abreu de Sousa (2026-10-18)
- fix(auth): eliminate Supabase OAuth fallback and allow web.app in CSP frame-src (290fd75) — Vitor Hugo Abreu de Sousa (2026-10-17)
- fix(build): protect outDir cleanup against Windows folder lock (0dce384) — Vitor Hugo Abreu de Sousa (2026-10-17)
- fix(auth): implement native Firebase Google OAuth popup and update CSP headers (fda9388) — Vitor Hugo Abreu de Sousa (2026-10-17)
- fix(hosting): add Cache-Control no-cache to HTML and immutable to static chunks in firebase.json (9462d6b) — Vitor Hugo Abreu de Sousa (2026-10-17)

### Outras
- chore: add auto-updating changelog system with script and GitHub Action (c1ac6cf) — Vitor Hugo Abreu de Sousa (2026-10-18)
- chore: record official publication address and enhance multi-tenant fallback (9076ac1) — Vitor Hugo Abreu de Sousa (2026-10-17)

## [1.2.0] - 2026-10-17
### Adicionado
- **Central de Ajuda Interna (`/ajuda`):** Base de conhecimento com artigos e FAQ interativo por categorias (WhatsApp, Agenda, Empresas, Atalhos e LGPD).
- **SEO Completo e Otimizado:** Metadados estruturados JSON-LD (Schema.org), `sitemap.ts` dinâmico, `robots.ts`, OpenGraph e Twitter Cards completos.
- **Card Devocional Bíblico e Mensagem Diária:** Componente dinâmico que sorteia uma mensagem cristã e versículo de encorajamento profissional a cada atualização de tela.
- **Auditoria de SEO Completa:** Documentação técnica detalhando Core Web Vitals, metatags e mapeamento de palavras-chave (`docs/AUDITORIA_SEO_COMPLETA.md`).
- **Pipeline de Integração Contínua (CI):** Workflow de GitHub Actions (`.github/workflows/ci.yml`).

## [1.1.0] - 2026-10-17
### Adicionado
- **Central de Atendimento e Agenda WhatsApp (`/whatsapp`):**
  - Módulo completo com suporte à Evolution API, Z-API, Meta Cloud API e Modo Manual (`wa.me`).
  - Webhook de recebimento automático com auto-confirmação ("1") e criação de tarefas de reagendamento ("2").
  - Sistema de Respostas Rápidas (Snippets) com atalhos como `/confirmar`, `/pix`, `/endereco`, `/preparo` e `/atraso`.
  - Disparos integrados na Agenda, Contatos e Clientes.
- **Migração SQL Unificada:** Arquivo `combined_full_schema.sql` gerado com todas as tabelas e políticas RLS.

## [1.0.0] - 2026-10-17
### Adicionado
- Lançamento inicial da plataforma SecJessica.
- Suporte a multi-empresas com isolamento estrito via PostgreSQL Row Level Security (RLS).
- Sincronização bidirecional com Google Agenda (OAuth 2.0).
- Gestão de clientes, contatos, tarefas e relatórios mensais.
