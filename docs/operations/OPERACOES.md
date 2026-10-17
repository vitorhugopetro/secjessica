# SecJessica — Operações e Deploy

## Ambientes

- Desenvolvimento: `npm run dev` (localhost:3000).
- Homologação: Vercel preview deployments.
- Produção: Vercel produção.

## Variáveis de ambiente (produção)

Definir na Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- `NEXT_PUBLIC_GOOGLE_REDIRECT_URI`

## Banco de dados (Supabase)

1. Criar projeto no Supabase.
2. Executar `supabase/schema.sql` no SQL Editor.
3. Executar `supabase/migrations/002_complete_entities.sql`.
4. Configurar URLs autorizadas no Supabase Auth (ex: `https://SEU-DOMINIO.vercel.app`).
5. Criar o primeiro administrador via cadastro público (o primeiro usuário se torna admin da sua organização).

## Deploy na Vercel

1. Conectar o repositório/pasta `E:\SecJessica` na Vercel.
2. Framework: Next.js (detectado automaticamente).
3. Build command: `npm run build`.
4. Adicionar variáveis de ambiente.
5. Fazer o deploy.

## Verificação pós-deploy

- Acessar `https://SEU-DOMINIO.vercel.app/entrar`.
- Criar conta e primeira empresa.
- Acessar `/dashboard` e `/agenda`.
- Verificar isolamento multiempresa (criar segunda empresa com outro usuário).

## Rollback

- Reverter o deploy na Vercel para a versão anterior.
- Migrações SQL são aditivas; não aplicar migrações destrutivas em produção automaticamente.

## Backup

- Backups gerenciados pelo Supabase. Verificar frequência e retenção no painel do Supabase.
- Procedimento de restauração: recriar projeto e aplicar migrações versionadas.

## Contato

Vitor Hugo Abreu de Sousa — vitorhugo1@gmail.com | (24) 98821-2712
