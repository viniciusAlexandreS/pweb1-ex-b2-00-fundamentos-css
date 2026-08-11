# Exercício-teste B2 — Fundamentos de CSS (seções 2.1 a 2.4)

**Vale 100 pontos** · Correção automática a cada envio (`push`) · Nível **básico e médio**.

Um **cartão de perfil** para você praticar o começo do CSS: **como incluir e a sintaxe** (2.1),
**seletores** (2.2), **box model** (2.3) e **cores/fundo/texto** (2.4).

O **HTML já está pronto**. Edite **apenas `css/style.css`**. Lembre da sintaxe:
`seletor { propriedade: valor; }` — **sem esquecer o `;`** no fim de cada declaração.

## Requisitos (edite `css/style.css`)

**Cores e fundo (2.4)**
- [ ] `body` com uma **cor de fundo** (`background-color`) — *básico* **(10)**
- [ ] `#topo` com uma **cor de fundo** (seletor de **id**) — *básico* **(12)**
- [ ] `.btn` com uma **cor de fundo** (seletor de **classe**) — *básico* **(16)**

**Texto (2.4) + seletores (2.2)**
- [ ] `h1` **centralizado** (`text-align: center`, seletor de **elemento**) — *médio* **(12)**
- [ ] `.cargo` em **negrito** (`font-weight: bold`) **ou** **itálico** (`font-style: italic`) — *básico* **(12)**

**Box model (2.3) — no `.cartao`**
- [ ] `padding` (espaço **interno**) — *básico* **(12)**
- [ ] `border` (uma **borda**) — *médio* **(14)**
- [ ] `margin` (espaço **externo**) — *médio* **(12)**

## Dicas

- Use `#` para id (`#topo`), `.` para classe (`.cartao`, `.btn`) e o **nome da tag** para
  elemento (`h1`).
- No box model, `padding` afasta o conteúdo da borda **por dentro**; `margin` afasta o cartão
  dos vizinhos **por fora**.
- Revise as seções **2.1 a 2.4** do material.

## Como entregar

Sem terminal (github.dev: tecla `.` → *Commit*). A correção roda na aba **Actions**. Refaça
até **100/100**.

## Ver a sua página no navegador

Para ver o resultado do seu CSS de verdade (não só a nota), há **duas formas**:

**1) Preview instantâneo (sem configurar nada).** Abra este endereço, trocando `SEU-USUARIO` e
`NOME-DO-REPO` pelos seus:

```
https://raw.githack.com/SEU-USUARIO/NOME-DO-REPO/master/index.html
```

Ele mostra a página com o seu CSS e **atualiza a cada envio**. É o jeito mais rápido enquanto
você trabalha.

**2) GitHub Pages (endereço `github.io`, configuração única).** No seu repositório:
**Settings → Pages → Source: _Deploy from a branch_ → Branch: `master` / `/(root)` → Save**. Em
1–2 minutos a página fica em `https://SEU-USUARIO.github.io/NOME-DO-REPO/`.
