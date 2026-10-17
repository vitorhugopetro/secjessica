# SecJessica — 30 Melhorias de Qualidade de Vida, Usabilidade e Segurança

Sistema multi-empresa de gestão para secretária remota integrado ao Google Agenda.
Versão: 1.0.0 | Desenvolvedor: Vitor Hugo Abreu de Sousa | Contato: vitorhugo1@gmail.com | (24) 98821-2712

---

## Segurança (10)

1. **Isolamento multi-empresa via RLS** — Row Level Security no Supabase garante que usuários só vejam dados da(s) empresa(s) a que pertencem (`company_members`, `user_company_ids()`).
2. **Autenticação centralizada** — Supabase Auth (email/senha) com gerenciamento de sessão via cookies seguros (`@supabase/ssr`).
3. **Validação de entrada com Zod** — todos os formulários (cadastro, empresa, cliente, contato, agendamento) validados client e server-side.
4. **Senha mínima obrigatória** — 6 caracteres no cadastro e login, aplicada via schema Zod.
5. **Tokens do Google Calendar protegidos** — access_token/refresh_token armazenados apenas no servidor, acessíveis via RLS pela empresa dono.
6. **Convites de usuário por token único e expiração** — token aleatório (`crypto.randomUUID`) válido por 7 dias (`company_invitations`).
7. **Middleware de proteção de rotas** — rotas do painel (`/dashboard`, `/clientes`, `/agenda`, etc.) redirecionam não autenticados para `/entrar`; autenticados saem de `/entrar`.
8. **Log de auditoria** — tabela `audit_logs` registra ação, entidade, usuário, empresa, IP e user-agent para rastreabilidade.
9. **Headers de segurança** — `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `X-XSS-Protection`, CSP restritiva (next.config.ts + vercel.json).
10. **Isolamento de sessão por empresa** — usuário só acessa empresas onde é membro cadastrado (`company_members`); não há acesso a dados de outras empresas.

---

## Usabilidade (10)

11. **Troca rápida de empresa** — seletor de empresa no cabeçalho e na página de Empresas; escolha é lembrada.
12. **Design responsivo mobile-first** — layout funciona em celular, tablet e desktop (Tailwind).
13. **Suporte a modo claro/escuro** — variáveis de tema com `prefers-color-scheme` e cores da marca SecJessica.
14. **Notificações toast** — feedback imediato de sucesso/erro após ações (cadastro, salvamento, exclusão).
15. **Estados de carregamento** — spinners e esqueletos enquanto dados são buscados.
16. **Validação em tempo real** — mensagens de erro inline nos formulários (react-hook-form + Zod).
17. **Busca rápida na topbar** — campo de pesquisa global para clientes, contatos e compromissos.
18. **Botões com estado de carregamento** — desabilitados durante requisições para evitar envio duplicado.
19. **Redirecionamento automático** — após login/cadastro o usuário vai direto para o painel da empresa.
20. **Estados vazios (empty states)** — mensagens claras quando não há clientes, contatos ou agendamentos.

---

## Qualidade de vida (10)

21. **Sincronização com Google Agenda** — OAuth do Google para conectar a agenda e criar/sincronizar compromissos.
22. **Multi-empresa ilimitado** — cadastre quantas empresas quiser (clínica de psicologia, odontologia, escritório de advocacia, etc.).
23. **Cada empresa tem seu próprio painel** — clientes, contatos e agenda isolados por empresa.
24. **Cadastro ilimitado de clientes e contatos** — sem limite de registros por empresa.
25. **Agendamentos com status** — agendado, confirmado, concluído, cancelado, com data/hora e cliente vinculado.
26. **Filtro de data na agenda** — visualize compromissos de um dia específico.
27. **Memorização da empresa selecionada** — preferência salva em `localStorage` e restaurada no próximo acesso.
28. **Campos de CPF/CNPJ, telefone e e-mail** — inputs dedicados com tipo apropriado.
29. **Onboarding guiado** — cadastro de conta já cria a primeira empresa (ex: clínica de psicologia).
30. **Pronto para produção** — build Next.js, variáveis de ambiente documentadas, deploy na Vercel e documentação legal completa.

---

## Dados do desenvolvedor

- Nome: Vitor Hugo Abreu de Sousa
- Telefone: (24) 98821-2712
- E-mail: vitorhugo1@gmail.com
- Sistema: SecJessica
