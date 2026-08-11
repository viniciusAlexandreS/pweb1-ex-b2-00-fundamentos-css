/**
 * Correção automática — Exercício-teste B2: Fundamentos de CSS (2.1 a 2.4)
 *
 * O HTML é fixo; o aluno edita css/style.css. Cobre seletores (id/classe/elemento),
 * box model (padding/border/margin) e cores/fundo/texto — nível básico e médio.
 *
 * Uso:  node avaliar.mjs [pastaDoAluno]
 */

import path from "node:path";
import { avaliar, exigir, exigirElemento } from "./lib/avaliador.js";

const args = process.argv.slice(2);
const formato = args.includes("--json") ? "json" : "texto";
const pastaAluno = path.resolve(args.find((a) => !a.startsWith("--")) ?? ".");

const TRANSP = (c) => !c || c === "transparent" || c.includes("rgba(0, 0, 0, 0)");

/** Cor de fundo computada de um seletor. */
async function fundo(pagina, sel, desc) {
  await exigirElemento(pagina, sel, desc);
  return pagina.locator(sel).first().evaluate((el) => getComputedStyle(el).backgroundColor);
}

const { nota } = await avaliar({
  titulo: "Exercício-teste B2 — Fundamentos de CSS (2.1 a 2.4)",
  pastaAluno,
  formato,
  verificacoes: ({ pagina }) => [
    // ── Cores e fundo (2.4) ───────────────────────────────────────
    {
      nome: "O body tem cor de fundo (background-color)",
      pontos: 10,
      executar: async () => {
        const c = await pagina.evaluate(() => getComputedStyle(document.body).backgroundColor);
        exigir(!TRANSP(c), "dê uma cor de fundo ao body (background-color)");
      },
    },
    {
      nome: "O #topo tem cor de fundo (seletor de id)",
      pontos: 12,
      executar: async () => {
        const c = await fundo(pagina, "#topo", "o cabeçalho #topo");
        exigir(!TRANSP(c), "dê uma cor de fundo ao #topo (use o seletor de id: #topo { ... })");
      },
    },
    {
      nome: "O .btn tem cor de fundo (seletor de classe)",
      pontos: 16,
      executar: async () => {
        const c = await fundo(pagina, ".btn", "o botão .btn");
        exigir(!TRANSP(c), "dê uma cor de fundo ao .btn (use o seletor de classe: .btn { ... })");
      },
    },

    // ── Texto (2.4) + seletores (2.2) ─────────────────────────────
    {
      nome: "O h1 está centralizado (text-align: center)",
      pontos: 12,
      executar: async () => {
        await exigirElemento(pagina, "h1", "o título h1");
        const a = await pagina.locator("h1").first().evaluate((el) => getComputedStyle(el).textAlign);
        exigir(a === "center", "centralize o h1 com text-align: center (seletor de elemento: h1 { ... })");
      },
    },
    {
      nome: "O .cargo está em negrito ou itálico",
      pontos: 12,
      executar: async () => {
        await exigirElemento(pagina, ".cargo", "o parágrafo .cargo");
        const r = await pagina.locator(".cargo").first().evaluate((el) => {
          const cs = getComputedStyle(el);
          return { weight: cs.fontWeight, style: cs.fontStyle };
        });
        exigir(
          parseInt(r.weight, 10) >= 700 || r.style === "italic",
          "destaque o .cargo com font-weight: bold ou font-style: italic"
        );
      },
    },

    // ── Box model (2.3) — no .cartao ──────────────────────────────
    {
      nome: "O .cartao tem padding (espaço interno)",
      pontos: 12,
      executar: async () => {
        await exigirElemento(pagina, ".cartao", "o .cartao");
        const p = await pagina.locator(".cartao").first().evaluate((el) =>
          parseFloat(getComputedStyle(el).paddingTop)
        );
        exigir(p > 0, "adicione padding ao .cartao (espaço interno)");
      },
    },
    {
      nome: "O .cartao tem borda (border)",
      pontos: 14,
      executar: async () => {
        const r = await pagina.locator(".cartao").first().evaluate((el) => {
          const cs = getComputedStyle(el);
          return { w: parseFloat(cs.borderTopWidth), s: cs.borderTopStyle };
        });
        exigir(r.w > 0 && r.s !== "none", "adicione uma border ao .cartao (ex.: 1px solid #ccc)");
      },
    },
    {
      nome: "O .cartao tem margin (espaço externo)",
      pontos: 12,
      executar: async () => {
        const m = await pagina.locator(".cartao").first().evaluate((el) => {
          const cs = getComputedStyle(el);
          return Math.max(
            parseFloat(cs.marginTop),
            parseFloat(cs.marginRight),
            parseFloat(cs.marginBottom),
            parseFloat(cs.marginLeft)
          );
        });
        exigir(m > 0, "adicione margin ao .cartao (espaço externo, afastando dos vizinhos)");
      },
    },
  ],
});

process.exit(formato === "json" || nota === 100 ? 0 : 1);
