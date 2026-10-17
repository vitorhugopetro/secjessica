import fs from "fs";
import path from "path";

const files = [
  "supabase/schema.sql",
  "supabase/migrations/002_complete_entities.sql",
  "supabase/migrations/003_whatsapp_integration.sql",
];

let combined = "-- ================================================================\n";
combined += "-- SecJessica: Esquema Completo Unificado de Banco de Dados (PostgreSQL)\n";
combined += `-- Gerado em: ${new Date().toISOString()}\n`;
combined += "-- Execute este script completo diretamente no SQL Editor do Supabase\n";
combined += "-- ================================================================\n\n";

for (const file of files) {
  const fullPath = path.resolve(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    combined += `\n-- >>> INICIO: ${file} <<<\n\n`;
    combined += fs.readFileSync(fullPath, "utf-8");
    combined += `\n\n-- >>> FIM: ${file} <<<\n\n`;
  }
}

fs.writeFileSync("supabase/migrations/combined_full_schema.sql", combined, "utf-8");
console.log("combined_full_schema.sql criado com sucesso!");
