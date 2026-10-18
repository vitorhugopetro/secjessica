const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const buildDir = path.join(rootDir, ".next_build");
const serverAppDir = path.join(buildDir, "server", "app");
const staticDir = path.join(buildDir, "static");
const publicDir = path.join(rootDir, "public");
const outDir = path.join(rootDir, "out");

console.log("Preparando diretório de distribuição estática para o Firebase Hosting...");

// 1. Limpa ou cria out/
if (fs.existsSync(outDir)) {
  for (const item of fs.readdirSync(outDir)) {
    const itemPath = path.join(outDir, item);
    try {
      fs.rmSync(itemPath, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    } catch (err) {
      console.warn(`Aviso ao limpar ${item}:`, err.message);
    }
  }
} else {
  fs.mkdirSync(outDir, { recursive: true });
}

// Helper para copiar recursivo
function copyFolderSync(from, to) {
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(to, { recursive: true });
  fs.readdirSync(from).forEach((element) => {
    const stat = fs.lstatSync(path.join(from, element));
    if (stat.isFile()) {
      fs.copyFileSync(path.join(from, element), path.join(to, element));
    } else if (stat.isDirectory()) {
      copyFolderSync(path.join(from, element), path.join(to, element));
    }
  });
}

// 2. Copia arquivos da pasta public/
if (fs.existsSync(publicDir)) {
  console.log("Copiando assets públicos de public/ -> out/...");
  copyFolderSync(publicDir, outDir);
}

// 3. Copia static chunks -> out/_next/static
if (fs.existsSync(staticDir)) {
  console.log("Copiando chunks otimizados de .next_build/static/ -> out/_next/static/...");
  const outNextStatic = path.join(outDir, "_next", "static");
  copyFolderSync(staticDir, outNextStatic);
}

// 4. Copia páginas pré-renderizadas de .next_build/server/app
if (fs.existsSync(serverAppDir)) {
  console.log("Estruturando páginas HTML para roteamento estático...");
  const files = fs.readdirSync(serverAppDir);

  for (const file of files) {
    const fullPath = path.join(serverAppDir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isFile() && file.endsWith(".html")) {
      const pageName = file.replace(/\.html$/, "");
      const content = fs.readFileSync(fullPath);

      if (pageName === "index") {
        fs.writeFileSync(path.join(outDir, "index.html"), content);
      } else {
        // Cria arquivo com nome e diretório com index.html para suporte a URLs limpas
        fs.writeFileSync(path.join(outDir, `${pageName}.html`), content);
        const subDir = path.join(outDir, pageName);
        fs.mkdirSync(subDir, { recursive: true });
        fs.writeFileSync(path.join(subDir, "index.html"), content);
      }
    }
  }

  // Copia robots e sitemap se existirem
  const robotsSrc = path.join(serverAppDir, "robots.txt.body");
  if (fs.existsSync(robotsSrc)) {
    fs.copyFileSync(robotsSrc, path.join(outDir, "robots.txt"));
  }

  const sitemapSrc = path.join(serverAppDir, "sitemap.xml.body");
  if (fs.existsSync(sitemapSrc)) {
    fs.copyFileSync(sitemapSrc, path.join(outDir, "sitemap.xml"));
  }
}

console.log("Diretório 'out/' gerado com sucesso para deploy no Firebase Hosting!");
