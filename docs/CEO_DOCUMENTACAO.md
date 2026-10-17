# SecJessica — Documentação do CEO / Visão de Negócio

## Visão geral

O **SecJessica** é um sistema completo de gestão para secretária remota, desenhado para ser usado por qualquer tipo de empresa (clínicas, consultórios, escritórios, prestadores de serviço). Cada empresa cadastrada ganha um painel independente com clientes, contatos e agenda, tudo integrado ao Google Agenda.

## Modelo de negócio

- **Público-alvo**: secretárias remotas, assistentes virtuais e prestadores de serviços administrativos que atendem múltiplos clientes (empresas).
- **Diferencial**: multi-empresa nativo — uma única conta da secretária gerencia quantas empresas ela quiser, cada uma com painel próprio.
- **Exemplos de uso**: clínica de psicologia (inicial), clínica odontológica, consultório de advogados, entre outros.

## Roadmap de implantação

1. Semana 1: clínica de psicologia (primeira empresa cadastrada).
2. Semana 2+: nova clínica odontológica — cadastro de nova empresa, painel novo.
3. Mês seguinte: consultório de advogados — nova empresa, mesmo sistema.

## Dados do desenvolvedor / responsável

- Nome: Vitor Hugo Abreu de Sousa
- Telefone: (24) 98821-2712
- E-mail: vitorhugo1@gmail.com

## Requisitos para produção

- Conta Supabase (banco de dados + auth).
- Projeto Vercel (deploy do frontend Next.js).
- Google Cloud Console (credenciais OAuth para Google Agenda).
- Variáveis de ambiente configuradas (ver `.env.example`).

## Documentação anexa

- `docs/30-MELHORIAS.md` — melhorias de qualidade de vida, usabilidade e segurança.
- `docs/TERMOS_DE_USO.md` — termos de uso.
- `docs/POLITICA_PRIVACIDADE_LGPD.md` — política de privacidade (LGPD).
- `docs/API_DOCUMENTACAO.md` — referência da API.
- `supabase/schema.sql` — esquema do banco de dados.
