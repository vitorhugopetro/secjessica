/**
 * @file scripts/update-changelog.js
 * @description Atualiza o CHANGELOG.md automaticamente a partir dos commits do Git.
 * Adiciona commits na seção "[Em Desenvolvimento]" sem sobrescrever versões manuais.
 *
 * Uso:
 *   node scripts/update-changelog.js
 */

import { execSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";

const REPO_ROOT = process.cwd();
const CHANGELOG_PATH = `${REPO_ROOT}/CHANGELOG.md`;

function runGit(args) {
  return execSync(`git ${args}`, { cwd: REPO_ROOT, encoding: "utf8" }).trim();
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

function generateSection(commits) {
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

function main() {
  let latestTag;
  try {
    latestTag = runGit("describe --tags --abbrev=0");
  } catch {
    latestTag = null;
  }
  const commits = getCommitsSince(latestTag);

  if (commits.length === 0) {
    console.log("✅ Nenhum commit novo. Changelog já está atualizado.");
    return;
  }

  const today = new Date().toISOString().split("T")[0];
  let current = readFileSync(CHANGELOG_PATH, "utf8");

  const devMarker = "## [Em Desenvolvimento]";
  const markerIndex = current.indexOf(devMarker);

  if (markerIndex === -1) {
    console.error("❌ Seção '[Em Desenvolvimento]' não encontrada no CHANGELOG.md");
    process.exit(1);
  }

  // Encontrar o fim da seção Em Desenvolvimento (próximo "## [" ou fim do arquivo)
  const nextSectionIndex = current.indexOf("\n## [", markerIndex + 1);
  const sectionEnd =
    nextSectionIndex === -1 ? current.length : nextSectionIndex;

  const newContent = generateSection(commits);
  const updated =
    current.slice(0, sectionEnd) + newContent + current.slice(sectionEnd);

  writeFileSync(CHANGELOG_PATH, updated, "utf8");
  console.log(`✅ CHANGELOG.md atualizado com ${commits.length} commit(s) na seção '[Em Desenvolvimento]'.`);
}

main();
