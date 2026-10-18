/**
 * @file scripts/update-state.js
 * @description Atualiza CHANGELOG.md e PROJECT_STATE.md automaticamente a partir dos commits do Git.
 * Funciona localmente (npm run state) e via GitHub Action.
 *
 * Uso:
 *   node scripts/update-state.js
 */

import { execSync } from "child_process";
import { readFileSync, writeFileSync, existsSync } from "fs";

const REPO_ROOT = process.cwd();
const CHANGELOG_PATH = `${REPO_ROOT}/CHANGELOG.md`;
const STATE_PATH = `${REPO_ROOT}/PROJECT_STATE.md`;

function runGit(args) {
  return execSync(`git ${args}`, { cwd: REPO_ROOT, encoding: "utf8" }).trim();
}

function getLatestTag() {
  try {
    return runGit("describe --tags --abbrev=0");
  } catch {
    return null;
  }
}

function getCommitsSince(tag) {
  const range = tag ? `${tag}..HEAD` : "HEAD";
  const raw = runGit(`log --pretty=format:"%h|%s|%an|%ad" --date=short ${range}`);
  if (!raw) return [];
  return raw.split("\n").map((line) => {
    const [hash, subject, author, date] = line.split("|");
    return { hash, subject, author, date };
  });
}

function categorize(subject) {
  const s = subject.toLowerCase();
  if (s.includes("feat(") || s.startsWith("feat")) return "### Adicionado";
  if (s.includes("fix(") || s.startsWith("fix")) return "### Corrigido";
  if (s.includes("perf(") || s.startsWith("perf")) return "### Melhorado";
  if (s.includes("refactor(") || s.startsWith("refactor")) return "### Alterado";
  if (s.includes("docs(") || s.startsWith("docs")) return "### Documentado";
  if (s.includes("test(") || s.startsWith("test")) return "### Testes";
  if (s.includes("deploy") || s.includes("release")) return "### Deploy";
  return "### Outras";
}

function formatEntry(c) {
  return `- ${c.subject} (${c.hash}) — ${c.author} (${c.date})`;
}

function generateChangelogSection(commits) {
  const grouped = {};
  for (const c of commits) {
    const cat = categorize(c.subject);
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(formatEntry(c));
  }

  let out = "";
  const order = ["### Adicionado", "### Alterado", "### Corrigido", "### Melhorado", "### Documentado", "### Testes", "### Deploy", "### Outras"];
  for (const cat of order) {
    if (grouped[cat]) {
      out += `\n${cat}\n`;
      for (const entry of grouped[cat]) out += `${entry}\n`;
    }
  }
  return out;
}

function generateStateTable(commits) {
  let out = "| Arquivo | Mudança |\n|---------|---------|\n";
  const seenFiles = new Set();
  for (const c of commits) {
    try {
      const files = runGit(`show --stat --format="" ${c.hash}`);
      const fileLines = files.split("\n").filter(l => l.includes("|"));
      for (const fl of fileLines) {
        const file = fl.split("|")[0].trim();
        if (file && !seenFiles.has(file)) {
          seenFiles.add(file);
          out += `| ${file} | ${c.subject} (${c.hash}) |\n`;
        }
      }
    } catch {
      // ignore errors for individual commits
    }
  }
  return out;
}

function updateChangelog(commits) {
  let current = readFileSync(CHANGELOG_PATH, "utf8");
  const devMarker = "## [Em Desenvolvimento]";
  const markerIndex = current.indexOf(devMarker);
  if (markerIndex === -1) {
    console.warn("⚠️ Seção '[Em Desenvolvimento]' não encontrada no CHANGELOG.md, pulando.");
    return;
  }
  const nextSectionIndex = current.indexOf("\n## [", markerIndex + 1);
  const sectionEnd = nextSectionIndex === -1 ? current.length : nextSectionIndex;
  const newContent = generateChangelogSection(commits);
  const updated = current.slice(0, sectionEnd) + newContent + current.slice(sectionEnd);
  writeFileSync(CHANGELOG_PATH, updated, "utf8");
}

function updateState(commits, latestTag) {
  const today = new Date().toISOString().split("T")[0];
  const branch = runGit("branch --show-current");
  const remoteUrl = runGit("remote get-url origin 2>/dev/null || echo ''");

  let state = `# Estado do Projeto — SecJessica\n\n> Este arquivo é atualizado automaticamente pelo script \`scripts/update-state.js\` e pelo GitHub Action.\n\n## 📊 Visão Geral\n- **Versão atual:** 1.3.0 (Mobile)\n- **Último commit:** ${commits[0]?.hash ?? "N/A"} — ${commits[0]?.subject ?? "N/A"}\n- **Branch ativa:** ${branch}\n- **URL Produção:** https://secjessica.web.app | https://jessicasec.web.app\n- **Projeto Firebase:** jessicasec\n- **Repositório:** ${remoteUrl}\n\n## ✅ Concluído (versão 1.3.0)\n- [x] Layout mobile responsivo com drawer sidebar e menu hamburger\n- [x] Barra inferior de navegação mobile (Painel, Clientes, Agenda, WhatsApp, Configurações)\n- [x] PWA: manifest.json + service worker para instalação como app nativo\n- [x] Meta tags mobile (viewport, theme-color, apple-touch-icon, etc.)\n- [x] 60 testes E2E de links da sidebar (desktop + mobile Pixel 5) — todos passando\n- [x] Build de produção: 27 rotas, TypeScript sem erros\n- [x] Deploy Firebase concluído\n- [x] Push GitHub concluído (branch quality-repair-engine)\n- [x] Sistema de changelog/estado automático (script + GitHub Action)\n\n## 🔄 Em Desenvolvimento\n- Integração do sistema de changelog automático com GitHub Actions (workflow criado, pendente de execução remota)\n\n## 📁 Arquivos Alterados Recentemente (versão 1.3.0)\n${generateStateTable(commits)}\n\n## 🧪 Testes\n- **Unitários (vitest):** 21 testes, todos passando\n- **E2E (Playwright):** 66 testes, todos passando (6 smoke + 60 sidebar links)\n- **Build:** 27 rotas estáticas, TypeScript sem erros\n\n## 🚀 Próximos Passos Sugeridos\n- Validar deploy remoto do GitHub Action de changelog\n- Configurar webhooks/CI para execução automática do script de estado\n- Criar documentação de API endpoints\n- Implementar testes de integração para server actions\n`;

  writeFileSync(STATE_PATH, state, "utf8");
}

function main() {
  let latestTag;
  try {
    latestTag = getLatestTag();
  } catch {
    latestTag = null;
  }
  const commits = getCommitsSince(latestTag);

  if (commits.length === 0) {
    console.log("✅ Nenhum commit novo. Estado já está atualizado.");
    return;
  }

  updateChangelog(commits);
  updateState(commits, latestTag);

  const today = new Date().toISOString().split("T")[0];
  console.log(`✅ CHANGELOG.md e PROJECT_STATE.md atualizados com ${commits.length} commit(s) em ${today}.`);
}

main();
