# SecJessica — Deploy na Vercel

## 1. Preparar o repositório

O projeto está em `E:\SecJessica`. É um aplicativo Next.js 16 (App Router) pronto para deploy na Vercel.

## 2. Criar conta na Vercel

Acesse https://vercel.com e crie uma conta (pode usar GitHub, Google ou e-mail).

## 3. Conectar o projeto

- Importe o repositório (ou faça push para um repositório GitHub/GitLab/Bitbucket e conecte).
- Framework preset: Next.js (detectado automaticamente).
- Build command: `npm run build`
- Install command: `npm install`
- Output detectado automaticamente.

## 4. Variáveis de ambiente

Adicione as seguintes variáveis nas configurações do projeto na Vercel:

| Variável | Exemplo |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon_key_do_supabase` |
| `GOOGLE_CLIENT_ID` | `SEU_CLIENT_ID_DO_GOOGLE` |
| `GOOGLE_CLIENT_SECRET` | `SEU_CLIENT_SECRET_DO_GOOGLE` |
| `GOOGLE_REDIRECT_URI` | `https://SEU-DOMINIO.vercel.app/api/google-calendar/callback` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | igual ao GOOGLE_CLIENT_ID |
| `NEXT_PUBLIC_GOOGLE_REDIRECT_URI` | igual ao GOOGLE_REDIRECT_URI |

O arquivo `vercel.json` já declara essas variáveis com placeholders (`@...`).

## 5. Banco de dados (Supabase)

1. Crie um projeto no Supabase (https://supabase.com).
2. No SQL Editor, execute o conteúdo de `supabase/schema.sql`.
3. Copie a URL e a `anon key` do projeto para as variáveis de ambiente da Vercel.

## 6. Google Agenda (opcional)

1. Acesse o Google Cloud Console.
2. Crie um projeto e ative a API Google Calendar.
3. Crie credenciais OAuth 2.0 (tipo "Aplicativo da Web").
4. Adicione o redirect URI: `https://SEU-DOMINIO.vercel.app/api/google-calendar/callback`.
5. Insira `client_id` e `client_secret` nas variáveis de ambiente da Vercel.

## 7. Implantar

Após configurar as variáveis, faça o deploy. O sistema ficará online em `https://SEU-DOMINIO.vercel.app`.

## 8. Acesso

- Página inicial: `/`
- Login: `/entrar`
- Cadastro: `/cadastro`
- Painel: `/dashboard` (após login)

## Contato

Vitor Hugo Abreu de Sousa — vitorhugo1@gmail.com | (24) 98821-2712
