# Política de Segurança da Informação & Conformidade LGPD — SecJessica

**Versão:** 1.0  
**Data de Aprovação:** Outubro de 2026  
**Responsável Técnico:** Vitor Hugo Abreu de Sousa (`vitorhugo1@gmail.com`)  
**Encarregado de Proteção de Dados (DPO):** Equipe SecJessica

---

## 1. Princípios e Diretrizes Gerais
O **SecJessica** foi arquitetado sob o conceito de **Privacy by Design** (Privacidade desde a Concepção), atendendo integralmente às determinações da **Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD)** e às exigências de sigilo profissional para atendimento em clínicas e consultórios médicos, odontológicos e psicológicos.

---

## 2. Medidas de Segurança Técnica Implementadas

### 2.1 Isolamento de Dados por RLS (Row Level Security)
- O banco de dados PostgreSQL (hospedado no Supabase) possui políticas ativas de **Row Level Security** em todas as tabelas.
- O identificador da empresa (`company_id`) é verificado em nível de engine SQL para cada query de `SELECT`, `INSERT`, `UPDATE` e `DELETE`.
- É **impossível** que um usuário de uma empresa visualize dados cadastrais, consultas, anotações ou telefones de outra empresa, mesmo em caso de erro na camada visual.

### 2.2 Criptografia em Trânsito e em Repouso
- **Em Trânsito:** Todo o tráfego entre navegador, Vercel, Supabase e APIs externas é protegido por **TLS 1.3 / HTTPS** com certificados SSL/TLS com renovação automática.
- **Em Repouso:** Bancos de dados gerenciados no Supabase utilizam criptografia de disco **AES-256**.
- **Tokens e Segredos:** Tokens de API de terceiros (Google OAuth, Evolution API) são manipulados exclusivamente via Server Actions e protegidos por variáveis de ambiente inacessíveis no frontend.

### 2.3 Logs de Auditoria Contínua (Audit Logs)
Todas as operações sensíveis geram registros imutáveis na tabela `audit_logs`:
- Identificador da Organização (`org_id`).
- Identificador do Usuário Operador (`user_id`).
- Tipo de Ação executada (ex: `client.created`, `whatsapp.config_updated`, `appointment.deleted`).
- Endereço IP e Timestamp com precisão de milissegundos.

---

## 3. Direitos dos Titulares de Dados (Pacientes e Clientes)

Em conformidade com o Artigo 18 da LGPD, o SecJessica assegura:
1. **Confirmação e Acesso:** O contratante pode visualizar a ficha completa do paciente no menu Clientes.
2. **Correção de Dados:** Edição imediata de dados incorretos ou desatualizados.
3. **Portabilidade:** Exportação de cadastros de contatos em formato aberto padrão **CSV**.
4. **Eliminação:** Exclusão definitiva de registros a pedido do titular ou término de contrato com a clínica.

---

## 4. Plano de Resposta a Incidentes
Qualquer suspeita de vulnerabilidade, falha de segurança ou acesso não autorizado deve ser comunicada imediatamente ao canal oficial:
- **E-mail:** `vitorhugo1@gmail.com`
- **Telefone / WhatsApp Emergencial:** `+55 (24) 98821-2712`
- **Prazo de Avaliação Preliminar:** Até 24 horas úteis.
