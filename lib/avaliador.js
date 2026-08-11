/**
 * avaliador.js — mini-framework de correção automática para os exercícios.
 *
 * Cada exercício declara uma lista de verificações com pontuação. O avaliador:
 *   1. sobe um servidor estático na pasta do aluno;
 *   2. abre a página num navegador real (Playwright);
 *   3. roda as verificações (DOM, estilos computados e comportamento JS);
 *   4. imprime um relatório amigável e escreve a nota no resumo do GitHub Actions.
 *
 * Não depende de GitHub Classroom: funciona em qualquer repositório com Actions.
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const TIPOS_MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

/** Sobe um servidor estático simples sobre `raiz`. Devolve { url, fechar }. */
export async function servirPasta(raiz) {
  const servidor = http.createServer((req, res) => {
    const caminhoUrl = decodeURIComponent(new URL(req.url, "http://x").pathname);
    let arquivo = path.join(raiz, caminhoUrl === "/" ? "/index.html" : caminhoUrl);

    // Impede sair da pasta do aluno
    if (!arquivo.startsWith(path.resolve(raiz))) {
      res.writeHead(403).end("Proibido");
      return;
    }
    if (!fs.existsSync(arquivo) || fs.statSync(arquivo).isDirectory()) {
      res.writeHead(404).end("Não encontrado");
      return;
    }
    res.writeHead(200, {
      "Content-Type": TIPOS_MIME[path.extname(arquivo)] || "application/octet-stream",
    });
    fs.createReadStream(arquivo).pipe(res);
  });

  await new Promise((ok) => servidor.listen(0, "127.0.0.1", ok));
  const { port } = servidor.address();
  return {
    url: `http://127.0.0.1:${port}`,
    fechar: () => new Promise((ok) => servidor.close(ok)),
  };
}

/** Erro de verificação com mensagem voltada ao aluno. */
export class FalhaDeVerificacao extends Error {}

/** Lança uma falha se a condição for falsa. */
export function exigir(condicao, mensagem) {
  if (!condicao) throw new FalhaDeVerificacao(mensagem);
}

/**
 * Garante que o elemento existe ANTES de inspecioná-lo e devolve o locator.
 * Usa count() (resposta imediata) em vez de esperar o timeout do Playwright,
 * para o aluno receber "não encontrei o cartão" em vez de um erro de timeout.
 */
export async function exigirElemento(pagina, seletor, descricao) {
  const qtd = await pagina.locator(seletor).count();
  exigir(qtd > 0, `não encontrei ${descricao} na página (seletor \`${seletor}\`)`);
  return pagina.locator(seletor).first();
}

/**
 * Executa as verificações e produz o relatório.
 * @param {object} opts
 * @param {string} opts.titulo        Nome do exercício
 * @param {string} opts.pastaAluno    Pasta com os arquivos entregues
 * @param {(ctx) => Array} opts.verificacoes  Função que devolve as verificações
 * @param {"texto"|"json"} [opts.formato]     "json" emite {"tests":[...]} no stdout
 *                                            (contrato do run_tests.sh / autograder)
 */
export async function avaliar({ titulo, pastaAluno, verificacoes, formato = "texto" }) {
  const { chromium } = await import("playwright");

  const servidor = await servirPasta(pastaAluno);
  const navegador = await chromium.launch();
  const pagina = await navegador.newPage();
  // Timeout curto: se um elemento não existe, o aluno deve saber em segundos,
  // não depois de 30s de espera por verificação.
  pagina.setDefaultTimeout(3000);

  const errosDeConsole = [];
  pagina.on("pageerror", (e) => errosDeConsole.push(e.message));

  let resultados = [];
  try {
    await pagina.goto(servidor.url, { waitUntil: "networkidle" });
    const lista = verificacoes({ pagina, errosDeConsole });

    for (const v of lista) {
      try {
        await v.executar();
        resultados.push({ ...v, ok: true });
      } catch (erro) {
        const msg =
          erro instanceof FalhaDeVerificacao
            ? erro.message
            : // Mensagens do Playwright trazem "Call log" e várias linhas;
              // o aluno só precisa da primeira, sem ruído técnico.
              `não foi possível verificar: ${erro.message.split("\n")[0].trim()}`;
        resultados.push({ ...v, ok: false, motivo: msg });
      }
    }
  } finally {
    await navegador.close();
    await servidor.fechar();
  }

  return relatar(titulo, resultados, formato);
}

/**
 * Imprime o relatório e devolve a nota.
 * - formato "texto": relatório colorido no stdout + resumo do Actions.
 * - formato "json" : relatório vai para o STDERR e o stdout recebe apenas
 *   {"tests":[...]} — o contrato consumido por run_tests.sh json / autograder.
 */
function relatar(titulo, resultados, formato = "texto") {
  const total = resultados.reduce((s, r) => s + r.pontos, 0);
  const obtido = resultados.reduce((s, r) => s + (r.ok ? r.pontos : 0), 0);
  const nota = total === 0 ? 0 : Math.round((obtido / total) * 100);

  // Em modo json o stdout é reservado ao JSON; o relatório humano vai ao stderr.
  const log = formato === "json" ? console.error : console.log;

  log(`\n  ${titulo}\n  ${"─".repeat(titulo.length)}`);
  for (const r of resultados) {
    const icone = r.ok ? "✔" : "✖";
    log(`  ${icone} [${r.ok ? r.pontos : 0}/${r.pontos}] ${r.nome}`);
    if (!r.ok) log(`      ↳ ${r.motivo}`);
  }
  log(`\n  Pontuação: ${obtido}/${total}  →  nota ${nota}/100\n`);

  if (formato === "json") {
    // Uma linha por verificação; a falha vai no test-name para o aluno ver o motivo.
    const tests = resultados.map((r) => ({
      "test-name": r.ok ? r.nome : `${r.nome} — ${r.motivo}`,
      passed: r.ok,
      score: r.ok ? r.pontos : 0,
      "max-score": r.pontos,
    }));
    process.stdout.write(JSON.stringify({ tests }) + "\n");
    return { obtido, total, nota };
  }

  // Resumo visual na aba Actions (e no PR, se houver)
  if (process.env.GITHUB_STEP_SUMMARY) {
    const linhas = resultados
      .map(
        (r) =>
          `| ${r.ok ? "✅" : "❌"} | ${r.nome} | ${r.ok ? r.pontos : 0}/${r.pontos} | ${
            r.ok ? "" : r.motivo.replace(/\|/g, "\\|")
          } |`
      )
      .join("\n");
    fs.appendFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      `## ${titulo}\n\n` +
        `**Nota: ${nota}/100** (${obtido} de ${total} pontos)\n\n` +
        `| | Verificação | Pontos | Observação |\n|---|---|---|---|\n${linhas}\n`
    );
  }
  // Arquivo consumível por scripts de coleta de notas e pelo adaptador do
  // Classroom 50 (que precisa do detalhe por verificação para o result.json).
  fs.writeFileSync(
    "nota.json",
    JSON.stringify(
      {
        titulo,
        obtido,
        total,
        nota,
        verificacoes: resultados.map((r) => ({
          nome: r.nome,
          ok: r.ok,
          pontos: r.pontos,
          obtidos: r.ok ? r.pontos : 0,
          motivo: r.ok ? "" : r.motivo,
        })),
      },
      null,
      2
    )
  );

  return { obtido, total, nota };
}

/** Permite rodar um avaliador direto pela linha de comando. */
export function ehExecucaoDireta(metaUrl) {
  return process.argv[1] === fileURLToPath(metaUrl);
}
