#!/usr/bin/env node
/**
 * Script de configuração automatizada para deploy Firebase no SecJessica
 * 
 * Pré-requisitos:
 * - Firebase CLI instalado (npm install -g firebase-tools)
 * - gcloud CLI instalado
 * - Logado no Firebase (firebase login)
 * - Projeto 'jessicasec' selecionado
 */

const { execSync } = require("child_process");
const fs = require("fs");

console.log("=== Configuração de Deploy Firebase - SecJessica ===\n");

try {
  // Verifica se o Firebase CLI está instalado
  try {
    execSync("firebase --version", { stdio: "pipe" });
  } catch {
    console.error("ERRO: Firebase CLI não está instalado.");
    console.log("Instale com: npm install -g firebase-tools");
    process.exit(1);
  }

  // Verifica se está logado
  try {
    execSync("firebase projects:list", { stdio: "pipe" });
  } catch {
    console.error("ERRO: Não está logado no Firebase.");
    console.log("Execute: firebase login");
    process.exit(1);
  }

  // Verifica se o projeto jessicasec existe
  try {
    const output = execSync("firebase projects:list --json", { encoding: "utf8" });
    const projects = JSON.parse(output);
    const jessicaSec = projects.find(function(p) { return p.projectId === "jessicasec"; });
    if (!jessicaSec) {
      console.error("ERRO: Projeto 'jessicasec' não encontrado.");
      console.log("Projetos disponíveis:", projects.map(function(p) { return p.projectId; }).join(", "));
      process.exit(1);
    }
    console.log("Projeto 'jessicasec' encontrado.\n");
  } catch {
    console.warn("Não foi possível verificar o projeto automaticamente.");
  }

  // Gera a service account key
  console.log("Gerando service account key para o projeto 'jessicasec'...");
  try {
    execSync("firebase projects:addfirebase jessicasec", { stdio: "pipe" });
  } catch {
    // Pode já estar adicionado, ignora
  }

  const saOutput = execSync(
    "gcloud iam service-accounts keys create /tmp/secjessica-sa.json --iam-account=firebase-adminsdk@jessicasec.iam.gserviceaccount.com",
    { encoding: "utf8", stdio: "pipe" }
  );

  console.log(saOutput);

  const saKey = fs.readFileSync("/tmp/secjessica-sa.json", "utf8");

  console.log("\n=== CHAVE DE SERVICE ACCOUNT GERADA ===\n");
  console.log("Copie o conteúdo abaixo e cole no GitHub Secrets:");
  console.log("Nome do secret: FIREBASE_SERVICE_ACCOUNT\n");
  console.log(saKey);
  console.log("\n=== FIM DA CHAVE ===\n");

  console.log("Próximos passos no GitHub:");
  console.log("1. Acesse: https://github.com/vitorhugopetro/secjessica/settings/secrets/actions");
  console.log("2. Clique em 'New repository secret'");
  console.log("3. Nome: FIREBASE_SERVICE_ACCOUNT");
  console.log("4. Valor: cole o JSON acima");
  console.log("5. Clique em 'Add secret'");
  console.log("\nApós salvar, o próximo push para 'main' disparará o deploy automático.");

} catch (err) {
  console.error("ERRO durante a configuração:", err.message);
  console.log("\nAlternativa manual:");
  console.log("1. Acesse o Firebase Console: https://console.firebase.google.com/project/jessicasec");
  console.log("2. Vá em Configurações do projeto > Contas de serviço");
  console.log("3. Clique em 'Gerar nova chave privada'");
  console.log("4. Baixe o JSON e adicione como secret FIREBASE_SERVICE_ACCOUNT no GitHub");
  process.exit(1);
}
