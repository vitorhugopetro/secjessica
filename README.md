# SecJessica

Sistema multi-empresa de gestão para secretária remota, integrado ao Google Agenda.

## Desenvolvedor

- Vitor Hugo Abreu de Sousa
- (24) 98821-2712
- vitorhugo1@gmail.com

## Tecnologias

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS v4
- Supabase (PostgreSQL + Auth + RLS)
- Google Calendar API
- Zod + React Hook Form (formulários)
- Lucide React (ícones)
- Deploy: Vercel

## Estrutura

```
src/
  app/                 # App Router (rotas: (app), (auth), api, auth/callback)
  components/          # UI (shadcn-like), layout (sidebar, topbar, app-shell)
  contexts/            # AuthProvider (multi-empresa)
  lib/                 # Supabase client/server, db types
supabase/
  schema.sql           # Esquema SQL multi-empresa com RLS
docs/                  # Documentação legal, CEO, API, deploy, 30 melhorias
```

## Variáveis de ambiente (`.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
GOOGLE_CLIENT_ID=seu_google_client_id
GOOGLE_CLIENT_SECRET=seu_google_client_secret
GOOGLE_REDIRECT_URI=https://seu-dominio.vercel.app/api/google-calendar/callback
NEXT_PUBLIC_GOOGLE_CLIENT_ID=seu_google_client_id
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=https://seu-dominio.vercel.app/api/google-calendar/callback
```

## Scripts

- `npm run dev` — servidor de desenvolvimento
- `npm run build` — build de produção
- `npm run start` — servidor de produção
- `npm run lint` — linter

## Banco de dados

Execute `supabase/schema.sql` no SQL Editor do Supabase para criar as tabelas e políticas RLS.

## Documentação

Veja a pasta `docs/`:
- `30-MELHORIAS.md` — melhorias de qualidade de vida, usabilidade e segurança
- `TERMOS_DE_USO.md`
- `POLITICA_PRIVACIDADE_LGPD.md`
- `CEO_DOCUMENTACAO.md`
- `API_DOCUMENTACAO.md`
- `DEPLOY_VERCEL.md`

## Deploy na Vercel

Conecte o repositório na Vercel, defina as variáveis de ambiente e faça o deploy. Consulte `docs/DEPLOY_VERCEL.md`.
