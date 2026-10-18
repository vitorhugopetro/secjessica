# Guia de Contribuição — SecJessica

Obrigado pelo interesse em contribuir com o **SecJessica**! Este documento orienta as boas práticas, fluxo de trabalho e padrões de engenharia adotados no repositório.

---

## 🛠️ Ambiente de Desenvolvimento Local

### Pré-requisitos
- **Node.js:** versão 20.x ou superior
- **NPM:** versão 10.x ou superior
- **Git** configurado

### Passo a Passo
1. Clone o repositório:
   ```bash
   git clone https://github.com/vitorhugopetro/secjessica.git
   cd secjessica
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Crie o arquivo `.env.local` a partir do modelo:
   ```bash
   cp .env.example .env.local
   ```
4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
   Acesse `http://localhost:3000`.

---

## 📐 Padrões de Código & Arquitetura

- **Framework:** Next.js 16 (App Router) com React 19 e TypeScript rigoroso.
- **Estilização:** Tailwind CSS com Design System baseado na paleta `secjessica` (tons de ameixa/vinho elegante `#6B3A4C`, champanhe e esmeralda).
- **Backend / Dados:** Supabase com PostgreSQL e Row Level Security (RLS). Toda operação de mutação deve ser feita via Server Actions tipadas em `src/features/<modulo>/actions/`.
- **Isolamento:** Toda tabela e query DEVE conter e filtrar estritamente por `company_id`.

---

## 🧪 Testes e Validação Obrigatória
Antes de enviar qualquer commit ou Pull Request, garanta que todos os testes passem:
```bash
# 1. Checagem de Tipos TypeScript (deve retornar 0 erros)
npx -p typescript tsc --noEmit

# 2. Testes Unitários de Isolamento Multi-Tenant
npm test
```

---

## 🌿 Padrão de Commits
Utilizamos o padrão **Conventional Commits**:
- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Alterações em documentação
- `test:` Inclusão ou ajuste de testes
- `refactor:` Refatoração de código sem alteração funcional
- `chore:` Tarefas de manutenção ou dependências
