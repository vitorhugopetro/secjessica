# SecJessica — Documentação da API

Base URL: `https://SEU-DOMINIO.vercel.app`

## Autenticação

Todas as rotas protegidas exigem sessão válida via Supabase Auth (cookies). As rotas de API usam o cliente Supabase de servidor e respeitam o RLS do banco.

## Rotas de autenticação

### GET /auth/callback
Callback do Supabase OAuth. Troca `code` por sessão e redireciona para `/dashboard`.

## Rotas da Agenda (Google Calendar)

### GET /api/google-calendar/auth?company_id=XYZ
Inicia o fluxo OAuth do Google. Redireciona o navegador para a tela de consentimento do Google.

### GET /api/google-calendar/callback?code=XXX&state=YYY
Recebe o código de autorização do Google, troca por tokens, armazena na tabela `google_calendar_connections` e redireciona para `/agenda/google?connected=1`.

## Variáveis de ambiente obrigatórias

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- `NEXT_PUBLIC_GOOGLE_REDIRECT_URI`

## Banco de dados (Supabase / PostgreSQL)

Esquema completo em `supabase/schema.sql`. Tabelas principais:

- `companies` — empresas (multi-tenancy)
- `profiles` — perfis de usuários
- `company_members` — vínculo usuário × empresa (multi-empresa)
- `clients` — clientes/pacientes
- `contacts` — contatos
- `appointments` — agendamentos/compromissos
- `google_calendar_connections` — conexões Google Agenda
- `company_invitations` — convites de usuários
- `audit_logs` — log de auditoria

## Segurança

Row Level Security (RLS) ativado em todas as tabelas. Usuários acessam apenas dados de empresas onde são membros. Políticas definidas no esquema SQL.

## Contato

Vitor Hugo Abreu de Sousa — vitorhugo1@gmail.com | (24) 98821-2712
