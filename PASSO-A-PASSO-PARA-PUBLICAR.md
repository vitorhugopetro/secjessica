# SecJessica — Passo a passo para publicar (ações suas)

O código está 100% implementado e o build de produção passa em `E:\SecJessica`.
As etapas abaixo dependem de suas credenciais pessoais (não posso executá-las em seu nome).

## 1. Supabase (banco + auth)

1. Acesse https://supabase.com e crie uma conta/projeto.
2. No SQL Editor, execute na ordem:
   - `supabase/schema.sql`
   - `supabase/migrations/002_complete_entities.sql`
3. Em Auth > URLs autorizadas, adicione:
   - `https://SEU-DOMINIO.vercel.app`
   - `https://SEU-DOMINIO.vercel.app/auth/callback`
4. Copie `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` das configurações do projeto.

## 2. Google Agenda (OAuth)

1. Acesse https://console.cloud.google.com, crie um projeto.
2. Habilite a API "Google Calendar API".
3. Crie credenciais OAuth 2.0 (tipo "Aplicativo da Web").
4. Adicione o redirect URI: `https://SEU-DOMINIO.vercel.app/api/google-calendar/callback`.
5. Copie `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`.

## 3. Vercel (deploy)

1. Acesse https://vercel.com e crie/conecte sua conta.
2. Importe a pasta/repositório `E:\SecJessica`.
3. Framework: Next.js (detectado automaticamente).
   - Build command: `npm run build`
   - Install command: `npm install`
4. Adicione as variáveis de ambiente (mesmas de `.env.example`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URI` (= `https://SEU-DOMINIO.vercel.app/api/google-calendar/callback`)
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
   - `NEXT_PUBLIC_GOOGLE_REDIRECT_URI`
5. Faça o deploy. O sistema ficará online em `https://SEU-DOMINIO.vercel.app`.

## 4. Verificação pós-deploy

- Acesse `/entrar`, crie sua conta e cadastre a primeira empresa (ex: clínica de psicologia).
- Acesse `/dashboard` e confirme o isolamento por empresa.
- Conecte o Google Agenda em `/agenda/google`.
- Cadastre uma segunda empresa (ex: consultório odontológico) com outro usuário — confirme que os dados não se misturam.

## 5. Documentação entregue

- `docs/CEO_DOCUMENTACAO.md` — visão de negócio e roadmap
- `docs/TERMOS_DE_USO.md`
- `docs/POLITICA_PRIVACIDADE_LGPD.md`
- `docs/30-MELHORIAS.md` — qualidade de vida, usabilidade, segurança
- `docs/API_DOCUMENTACAO.md`
- `docs/DEPLOY_VERCEL.md`
- `docs/architecture/ARQUITETURA.md`
- `docs/api/endpoints.md`
- `docs/operations/OPERACOES.md`
- `SECURITY.md` — política de segurança
- `README.md` — guia de instalação

## Dados do responsável (cadastrados no sistema)

Vitor Hugo Abreu de Sousa — (24) 98821-2712 — vitorhugo1@gmail.com

## Etapas bloqueadas (dependem de você)

- Criar conta e projeto no Supabase
- Executar as migrações SQL no Supabase
- Criar projeto e credenciais OAuth no Google Cloud Console
- Criar conta e deploy na Vercel
- Configurar as variáveis de ambiente reais (nunca commite segredos)

O código, o banco versionado, os testes, a documentação legal e técnica estão prontos. Após concluir as 5 etapas acima, o SecJessica estará 100% online.
