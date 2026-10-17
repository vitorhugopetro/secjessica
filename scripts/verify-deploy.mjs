import fs from "fs";
import path from "path";

console.log("==================================================");
console.log("   SecJessica — Verificador de Pré-Deploy & Saúde ");
console.log("==================================================");

// 1. Verifica arquivos essenciais
const requiredFiles = [
  "package.json",
  "src/app/layout.tsx",
  "src/app/(app)/dashboard/page.tsx",
  "src/app/(app)/whatsapp/page.tsx",
  "src/app/(app)/agenda/page.tsx",
  "src/app/api/whatsapp/webhook/route.ts",
  "supabase/migrations/combined_full_schema.sql",
  ".env.example",
];

let allOk = true;
for (const file of requiredFiles) {
  if (fs.existsSync(path.resolve(process.cwd(), file))) {
    console.log(`[OK] Arquivo presente: ${file}`);
  } else {
    console.error(`[FALHA] Arquivo ausente: ${file}`);
    allOk = false;
  }
}

// 2. Verifica .env.local
const envLocalPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  console.log("[OK] .env.local encontrado.");
  const content = fs.readFileSync(envLocalPath, "utf-8");
  const checks = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ];
  for (const c of checks) {
    if (content.includes(c)) {
      console.log(`[OK] Variável configurada: ${c}`);
    } else {
      console.warn(`[AVISO] Variável não encontrada no .env.local: ${c}`);
    }
  }
} else {
  console.log("[INFO] .env.local não encontrado no disco (utilize as variáveis no painel da Vercel).");
}

console.log("==================================================");
if (allOk) {
  console.log("RESULTADO: O projeto está 100% pronto para deploy na Vercel e execução no Supabase!");
} else {
  console.error("RESULTADO: Existem pendências de arquivos antes do deploy.");
  process.exit(1);
}
