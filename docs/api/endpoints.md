# SecJessica — Documentação da API

Base URL: `https://SEU-DOMINIO.vercel.app`

## Autenticação

Todas as rotas protegidas exigem sessão válida via Supabase Auth (cookies). As Server Actions validam a sessão e a associação usuário × organização no servidor.

## Rotas de autenticação

### GET /auth/callback
Callback do Supabase OAuth. Troca `code` por sessão e redireciona para o painel.

## Rotas da Agenda (Google Calendar)

### GET /api/google-calendar/auth?company_id=XYZ
Inicia o fluxo OAuth do Google. Requer `GOOGLE_CLIENT_ID` e `GOOGLE_REDIRECT_URI`.

### GET /api/google-calendar/callback?code=XXX&state=YYY
Recebe o código, troca por tokens no servidor, armazena na tabela `calendar_connections` e redireciona para `/agenda/google?connected=1`.

## Server Actions (backend)

Todas validam autenticação e organização:

- `createOrganization` — cria organização e vincula o criador como admin.
- `listOrganizations` — lista organizações do usuário.
- `getOrganization`, `updateOrganization`, `deleteOrganization`.
- `listContacts`, `createContact`, `deleteContact`, `importContactsCSV`, `exportContactsCSV`.
- `listAppointments`, `createAppointment` (com validação de conflito de horário), `deleteAppointment`.
- `listTasks`, `createTask`, `listOverdueTasks`.
- `listMessageTemplates`, `createMessageTemplate`.
- `listReports`, `exportAppointmentsCSV`.
- `listNotifications`, `markNotificationRead`, `createSystemNotification`.
- `auditLog` — grava log de auditoria.

## Variáveis de ambiente

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- `NEXT_PUBLIC_GOOGLE_REDIRECT_URI`

## Segurança

- Row Level Security em todas as tabelas multiempresa.
- Tokens nunca expostos ao frontend.
- Auditoria em `audit_logs`.

## Contato

Vitor Hugo Abreu de Sousa — vitorhugo1@gmail.com | (24) 98821-2712
