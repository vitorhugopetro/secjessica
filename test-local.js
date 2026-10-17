/**
 * SecJessica - Teste Local de Smoke
 * 
 * Uso: node test-local.js
 * 
 * Pré-requisito: rodar `npm run start` (ou `npm run dev`) em outro terminal.
 * 
 * Este script acessa as rotas públicas e exibe o status de cada uma.
 */

import http from 'node:http';

const BASE = 'http://localhost:3000';
const TIMEOUT_MS = 10000;

const rotas = [
  { nome: 'Home (landing pública)', path: '/' },
  { nome: 'Login', path: '/entrar' },
  { nome: 'Cadastro', path: '/cadastro' },
  { nome: 'Dashboard (deve redirecionar)', path: '/dashboard' },
];

function get(path) {
  return new Promise((resolve, reject) => {
    const req = http.get(`${BASE}${path}`, { timeout: TIMEOUT_MS }, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => resolve({ status: res.statusCode, body: body.slice(0, 200) }));
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.on('error', (e) => reject(e));
  });
}

async function main() {
  console.log(`SecJessica - Teste local de smoke\nAlvo: ${BASE}\n`);

  let falhas = 0;

  for (const rota of rotas) {
    try {
      const r = await get(rota.path);
      const ok = r.status >= 200 && r.status < 400 || r.status === 302 || r.status === 307;
      console.log(`${ok ? '✓' : '✗'} ${rota.nome} — status ${r.status} ${ok ? 'OK' : 'FALHA'}`);
      if (!ok) falhas++;
    } catch (e) {
      console.log(`✗ ${rota.nome} — ERRO: ${e.message}`);
      falhas++;
    }
  }

  console.log(`\n${falhas === 0 ? 'Todas as rotas responderam OK.' : `${falhas} rota(s) com falha.`}\n`);
  console.log('Para testar funcionalidades autenticadas:');
  console.log('1. Acesse http://localhost:3000/cadastro e crie uma conta');
  console.log('2. Cadastre sua primeira empresa');
  console.log('3. Acesse http://localhost:3000/dashboard');

  process.exit(falhas === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
