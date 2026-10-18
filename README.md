# Sec Jessica

Plataforma inteligente multi-empresa de secretariado remoto, gestão de consultórios e recepção virtual, com automação completa de agendamentos via WhatsApp, sincronização com Google Agenda e infraestrutura de alta disponibilidade em Firebase.

🌐 **Site Oficial em Produção:** [https://secjessica.web.app](https://secjessica.web.app) (Espelho: [https://jessicasec.web.app](https://jessicasec.web.app))

---

## 👨‍💻 Desenvolvedor e Contato

- **Autor:** Vitor Hugo Abreu de Sousa
- **WhatsApp / Telefone:** (24) 98821-2712
- **E-mail:** vitorhugo1@gmail.com
- **Repositório GitHub:** [https://github.com/vitorhugopetro/secjessica](https://github.com/vitorhugopetro/secjessica)

---

## 🚀 Tecnologias

- **Frontend & SSR:** Next.js 16 (App Router), React 19, TypeScript
- **Estilização & UI:** Tailwind CSS, Lucide React, Radix UI Dialog & Dropdowns
- **Hospedagem & Infraestrutura Cloud:** Firebase Hosting (CDN global, SSL automático, HTTP/2)
- **Backend & Banco de Dados:**
  - **Firebase:** Cloud Firestore (regras de segurança multi-tenant em `firestore.rules`), Firebase Auth
  - **Supabase:** PostgreSQL com Row Level Security (RLS) e schemas relacionais
- **Integrações Inteligentes:**
  - Central de WhatsApp via Evolution API / Z-API / Meta Cloud API
  - Google Calendar API (OAuth 2.0 com sincronização bidirecional)
- **SEO & Performance:** Score 100/100, Schema.org JSON-LD, Sitemap dinâmico e Robots.txt

---

## 📂 Estrutura do Projeto

```
src/
  app/                 # Rotas do App Router (Dashboard, WhatsApp, Agenda, Ajuda, etc.)
  components/          # Componentes de UI, Sidebar, Topbar, Modais e Banners
  contexts/            # Contexto de Autenticação Híbrida (Firebase Auth + Supabase)
  features/            # Módulos de Domínio (Contatos, Tarefas, Relatórios, etc.)
  lib/                 # Clientes Firebase (REST nativo ultraleve) e Supabase
docs/                  # Documentação completa do sistema
  AUDITORIA_SEO_COMPLETA.md
  MANUAL_DA_SECRETARIA.md
  GUIA_WHATSAPP_EVOLUTION_API.md
  LGPD_E_SEGURANCA_DE_DADOS.md
  TERMOS_DE_USO.md
  POLITICA_PRIVACIDADE_LGPD.md
  CEO_DOCUMENTACAO.md
```

---

## ⚙️ Variáveis de Ambiente (`.env.local`)

```env
# URL Canônica
NEXT_PUBLIC_APP_URL=https://secjessica.web.app

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBDXHf3ElpDLR2UCruErpRobxUy1hBOY5w
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=jessicasec.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=jessicasec
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=jessicasec.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=948645833442
NEXT_PUBLIC_FIREBASE_APP_ID=1:948645833442:web:bec7e39a17eefaadacccbb

# Supabase (opcional / híbrido)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key

# Google Calendar OAuth 2.0
GOOGLE_CLIENT_ID=seu_google_client_id
GOOGLE_CLIENT_SECRET=seu_google_client_secret
GOOGLE_REDIRECT_URI=https://secjessica.web.app/api/google-calendar/callback
```

---

## 💻 Scripts Disponíveis

```bash
# Servidor local de desenvolvimento
npm run dev

# Build de produção otimizado com empacotamento estático
npm run build

# Execução da suíte de testes unitários
npm test

# Deploy instantâneo para o Firebase Hosting
npm run deploy:firebase
```

---

## 🔒 Conformidade LGPD & Segurança

O sistema foi concebido segundo o princípio de *Privacy by Design*:
- Isolamento criptográfico e por tenant (`company_id`) em todas as coleções do Firestore e tabelas SQL.
- Políticas de segurança e headers HTTP de alto rigor (CSP, HSTS, X-Frame-Options, X-Content-Type-Options).
- Logs de auditoria para ações sensíveis de secretárias e administradores.
- Documentação detalhada em `docs/LGPD_E_SEGURANCA_DE_DADOS.md`.

---

## 📖 Central de Ajuda

Acesse a central integrada diretamente na aplicação pelo menu lateral ou pela URL:
👉 **[https://secjessica.web.app/ajuda](https://secjessica.web.app/ajuda)**
