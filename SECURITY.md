# SecJessica — Política de Segurança

Versão: 1.0.0

## 1. Princípios

O SecJessica adota defensiva em profundidade, isolamento multiempresa e validação no servidor como pilares de segurança.

## 2. Autenticação e sessões

- Autenticação via Supabase Auth (e-mail/senha).
- Sessões gerenciadas por cookies seguros (`@supabase/ssr`).
- Validação de identidade no servidor a cada requisição protegida.
- Middleware de Next.js protege rotas do painel; não autenticados são redirecionados para `/entrar`.
- Não há conta administrativa padrão com senha conhecida.

## 3. Isolamento multiempresa

- Row Level Security (RLS) ativado em todas as tabelas multiempresa.
- Função `user_org_ids()` retorna apenas organizações às quais o usuário pertence.
- Todas as políticas RLS filtram por `organization_id = any(user_org_ids())`.
- Server Actions validam a associação usuário × organização antes de qualquer operação.
- Testes de isolamento tentam acessar registros de outra organização por ID manipulado.

## 4. Cabeçalhos HTTP de segurança

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-XSS-Protection: 1; mode=block`
- Content Security Policy restritiva (next.config.ts e vercel.json)

## 5. Validação de entrada

- Zod para validação de todos os formulários (client e server).
- Server Actions revalidam dados recebidos; nunca confia apenas no frontend.

## 6. Tokens e segredos

- Tokens do Google OAuth armazenados no servidor, nunca expostos ao frontend.
- Logs nunca registram tokens, senhas ou dados confidenciais.
- `.env.example` sem credenciais reais.
- Segredos configurados apenas nas variáveis de ambiente da Vercel/Supabase.

## 7. Auditoria

- Tabela `audit_logs` registra operações relevantes (criação, atualização, exclusão, exportação, convites).
- Registra ação, entidade, usuário, organização, IP e user-agent.
- Usuário comum não pode excluir livremente seus próprios registros de auditoria.

## 8. Rate limiting e proteção

- Rate limiting recomendado na camada de edge/Vercel e Supabase Auth.
- Proteção contra enumeração de contas nas mensagens de erro.

## 9. Backup e restauração

- Backups gerenciados pelo Supabase (documentar frequência e retenção).
- Procedimento de restauração via migrações SQL versionadas (`supabase/migrations/`).

## 10. Procedimento de resposta a incidentes

- Revogar sessões e tokens comprometidos.
- Rotacionar segredos OAuth e de ambiente.
- Revisar logs de auditoria em `audit_logs`.
- Notificar titulares afetados conforme LGPD.

## 11. Contato de segurança

Vitor Hugo Abreu de Sousa — vitorhugo1@gmail.com | (24) 98821-2712
