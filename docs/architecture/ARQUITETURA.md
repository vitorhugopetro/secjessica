# SecJessica — Arquitetura

## Visão geral

Aplicação SaaS de secretariado remoto, multi-empresa, construída com Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v3 e Supabase (PostgreSQL + Auth + RLS).

## Stack

- Frontend: Next.js App Router, React 19, TypeScript strict, Tailwind CSS v3, shadcn/ui-like components, Lucide React.
- Backend: Next.js Route Handlers + Server Actions.
- Banco: Supabase PostgreSQL, Supabase Auth, Row Level Security.
- Integração: Google Calendar API (OAuth 2.0 por empresa).
- Hospedagem: Vercel.

## Camadas

1. Apresentação: `src/app/` (rotas), `src/components/ui/` (componentes base), `src/components/layout/` (sidebar, topbar, app-shell).
2. Autenticação: `src/contexts/auth-context.tsx` (AuthProvider, multi-empresa, troca de empresa).
3. Servidor: `src/server/lib/organizations.ts` (validação de org, auditoria).
4. Regras de negócio: `src/features/*/actions/index.ts` (Server Actions com validação Zod e RLS).
5. Persistência: `supabase/schema.sql` (migração 001) e `supabase/migrations/002_complete_entities.sql` (migração 002).

## Multiempresa

- Tabela `organizations` (canônica) e `companies` (legado mantida pela app).
- `organization_members` vincula usuários a organizações com função (role).
- RLS isola dados por organização via `user_org_ids()`.
- Um usuário pode pertencer a múltiplas empresas; seleciona uma ativa por vez.

## Segurança

- Nenhuma lógica crítica de negócio no frontend.
- Chaves administrativas do Supabase nunca no navegador.
- Tokens OAuth armazenados só no servidor.
- Cabeçalhos de segurança e CSP.

## Testes

- Unitários: Vitest (`src/tests/unit/`).
- E2E: Playwright (`src/tests/e2e/`).
- Isolamento multiempresa testado negativamente.

## Documentação

- `docs/` — legal, API, deploy, CEO, 30 melhorias.
- `SECURITY.md` — política de segurança.
- `README.md` — guia de instalação e variáveis de ambiente.
