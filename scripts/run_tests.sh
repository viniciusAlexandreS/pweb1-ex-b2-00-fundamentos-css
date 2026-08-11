#!/usr/bin/env bash
#
# Corretor automático do exercício (HTML/CSS/JS).
#
#   ./scripts/run_tests.sh          -> roda tudo e imprime a nota 0-100 (uso do aluno)
#   ./scripts/run_tests.sh json     -> relatório em JSON no stdout (consumido pelo autograder)
#
# O modo "json" é a fonte de verdade do autograder do Classroom 50
# (atividades/classroom50/autograder-web.py). É o MESMO corretor que o aluno roda
# com `npm test`, garantindo que a nota vista antes de enviar é a nota recebida.

set -uo pipefail
cd "$(dirname "$0")/.."

MODO="${1:-tudo}"

# ── dependências (idempotente; rápido quando já instalado) ───────────────────
[ -d node_modules/playwright ] || npm install --silent
if [ -n "${CI:-}" ]; then
  # no runner do GitHub, instala também as libs de sistema do Chromium
  npx playwright install --with-deps chromium >/dev/null 2>&1 || true
else
  npx playwright install chromium >/dev/null 2>&1 || true
fi

case "$MODO" in
  json) node avaliar.mjs . --json ;;   # stdout = {"tests":[...]}, logs no stderr
  tudo) node avaliar.mjs . ;;          # relatório + nota; exit 0 só com 100/100
  *) echo "modo desconhecido: $MODO (use nada ou 'json')" >&2; exit 2 ;;
esac
