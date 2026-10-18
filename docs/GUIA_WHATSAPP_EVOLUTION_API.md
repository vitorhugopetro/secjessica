# Guia Técnico de Integração WhatsApp — SecJessica

Este guia orienta a configuração técnica da infraestrutura de WhatsApp para o SecJessica, contemplando **Evolution API**, **Z-API**, **Meta Cloud API Oficial** e o **Modo Manual (wa.me)**.

---

## 🏗️ 1. Arquitetura da Integração

O SecJessica foi concebido sob um padrão resiliente de **Duplo Modo de Operação**:

```
                       ┌─────────────────────────┐
                       │  SecJessica UI / Agenda │
                       └────────────┬────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
       [ Modo API Automatizada ]           [ Modo Manual / Standalone ]
      ┌─────────────────────────┐         ┌─────────────────────────────┐
      │ Evolution API / Z-API   │         │ Links diretos wa.me pré-     │
      │ Disparo silencioso HTTP │         │ formatados com codificação   │
      │ Webhook com callbacks   │         │ URI para WhatsApp Web        │
      └────────────┬────────────┘         └─────────────────────────────┘
                   ▼
      ┌─────────────────────────┐
      │  Webhook SecJessica     │
      │  /api/whatsapp/webhook  │
      └─────────────────────────┘
```

---

## 🚀 2. Provedor 1: Evolution API (Recomendado / Auto-hospedado)

A **Evolution API** é uma solução open-source baseada em Baileys que permite conectar números de WhatsApp físicos via QR Code em servidores VPS (DigitalOcean, Hetzner, AWS, Oracle Cloud ou Docker local).

### 2.1 Subindo a Evolution API com Docker Compose
Crie um arquivo `docker-compose.yml`:
```yaml
version: "3.7"
services:
  evolution-api:
    image: atendai/evolution-api:latest
    container_name: evolution_api
    restart: always
    ports:
      - "8080:8080"
    environment:
      - SERVER_URL=https://api-whatsapp.seudominio.com
      - AUTHENTICATION_API_KEY=sua_chave_secreta_aqui
    volumes:
      - evolution_instances:/evolution/instances

volumes:
  evolution_instances:
```

### 2.2 Configurando no SecJessica
1. Acesse o menu **WhatsApp > Conexão & QR Code**.
2. Preencha:
   - **Provedor:** Evolution API
   - **Nome da Instância:** `secjessica-clinica`
   - **URL da API:** `https://api-whatsapp.seudominio.com`
   - **Chave de API:** `sua_chave_secreta_aqui`
3. Copie a **URL do Webhook** gerada na tela:
   `https://secjessica.vercel.app/api/whatsapp/webhook?company_id=ID_DA_EMPRESA`
4. Na Evolution API, registre o webhook para os eventos `MESSAGES_UPSERT`.

---

## ⚡ 3. Provedor 2: Z-API

Se preferir uma infraestrutura SaaS gerenciada:
1. Crie sua conta em [z-api.io](https://z-api.io).
2. Obtenha o `Instance ID` e o `Client Token`.
3. No SecJessica, insira os dados no painel de configurações.
4. O SecJessica fará o roteamento transparente das chamadas de envio e leitura dos retornos.

---

## ☁️ 4. Provedor 3: Meta Cloud API (WhatsApp Business Oficial)

1. Crie um app no [developers.facebook.com](https://developers.facebook.com).
2. Adicione o produto WhatsApp e obtenha:
   - `Phone Number ID`
   - `Permanent Access Token`
3. Configure o Webhook no portal da Meta apontando para:
   `https://secjessica.vercel.app/api/whatsapp/webhook`
4. Token de verificação: `secjessica_verify_token` (configurável via `WHATSAPP_WEBHOOK_VERIFY_TOKEN`).

---

## 📱 5. Modo 4: Modo Manual (wa.me) — Sem Custos

Se a clínica ou secretária não deseja pagar nenhum servidor de API:
1. Deixe o provedor configurado como **Modo Manual**.
2. Em qualquer agendamento ou contato, clique em **"Abrir no WhatsApp Web"**.
3. O sistema formata a mensagem com E.164 (`55DDDNUMERO`) e codificação UTF-8, abrindo a conversa em 1 clique.
4. **Custo zero**, sem risco de banimento e com usabilidade instantânea.

---

## 🔒 6. Tratamento de Webhooks & Segurança
O endpoint `/api/whatsapp/webhook`:
- Normaliza números telefônicos brasileiros (tratando o nono dígito e DDI 55).
- Relaciona o remetente ao cliente/contato e ao agendamento mais recente.
- Executa a auto-confirmação se a resposta for `"1"`, `"Sim"` ou `"Confirmo"`.
- Cria tarefa urgente para a secretária se a resposta for `"2"` ou `"Reagendar"`.
