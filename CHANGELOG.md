# Registro de Alterações (Changelog) — SecJessica

Todas as mudanças notáveis deste projeto serão documentadas neste arquivo.
O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/) e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

---

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
