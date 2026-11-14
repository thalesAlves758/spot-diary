---
id: CARD-033
titulo: "Sortear um lugar e atalhos do ícone"
contexto: sair-de-casa
tipo: feature
camadas: [front]
complexidade: M
prioridade: mvp
incerteza: baixa
modelo_sugerido: sonnet
status: done
requisitos: [RF26, RF27, RN22]
depende_de: [CARD-031]
---

# CARD-033 — Sortear um lugar e atalhos do ícone

## Contexto
O app existe para responder "onde a gente vai hoje?". Com uma lista filtrada na mão (por exemplo, "Já fui" + "voltaria = sim" + nota 4 ou mais), ainda falta decidir. Um sorteio entre os cards visíveis resolve isso. Os atalhos do ícone do app (segurar o ícone no Android) dão acesso direto a "Novo lugar" e "Sortear".

## Objetivo
- Na tela inicial, um botão "Sortear" na linha da ordenação, que sorteia entre os cards visíveis e mostra o resultado num painel (T9).
- Os atalhos "Novo lugar" e "Sortear" no ícone do app.

## Detalhamento técnico
- **`js/services/lists.js`:**
  ```js
  /** One random item (RN22). With 2+ items, never returns `excludeId`. `null` if the list is empty. */
  export function pickRandom(items, { excludeId = null, random = Math.random } = {})
  ```
  - Com 2 ou mais itens, sorteia entre os que têm `place.id !== excludeId`; com 1 item, devolve esse item.
  - Os itens são `{ place, summary }`. Cada um tem a mesma chance: `Math.floor(random() * n)`.
- **`js/ui/screens/home.js`:**
  - **Linha da ordenação** (`sortRow`): ganha à direita o botão "Sortear", com o ícone `dice` e 44 px de altura.
    - A linha passa a ter "Ordenar: … ▾" à esquerda e "🎲 Sortear" à direita, e continua oculta quando a aba não tem cards visíveis.
    - O `aria-label` do botão é "Sortear um lugar da lista".
  - **`openDrawSheet({ items, status })`**, o painel T9: usa `openBottomSheet` com o título "Sorteado!".
    - **Conteúdo:** o card do lugar sorteado, reaproveitando `renderCard(item, status)` dentro de uma `ul.card-list`.
    - **Rodapé:**
      - "Sortear de novo" (`btn-ghost`): sorteia outro com `pickRandom(items, { excludeId: atual })` e troca o card. Fica desabilitado quando `items.length < 2`.
      - "Ver lugar" (`btn-primary`): fecha o painel e chama `navigate('/place/<id>')`.
    - Tocar no próprio card também abre o detalhe (o router já fecha os painéis ao trocar de tela).
    - `items` é a lista visível na hora do toque: `visible(current)`, com busca e filtros aplicados.
  - **Query `draw=1`** (vem do atalho do ícone): no `render`, quando `query.get('draw') === '1'`:
    1. Abra na aba "Quero ir", **sem** busca e sem filtros. Ignore `q` e os filtros da query.
    2. Tire o `draw` da URL com `setQuery`, para recarregar ou voltar não sortear de novo.
    3. Se "Quero ir" tiver lugares, abra `openDrawSheet` com a lista dela. Se estiver vazia, mostre o toast "Nenhum lugar em "Quero ir" para sortear.".
- **`manifest.webmanifest`:** adicione `shortcuts`, com os ícones existentes.
  ```json
  "shortcuts": [
    { "name": "Novo lugar", "short_name": "Novo", "url": "./#/place/new", "icons": [{ "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png" }] },
    { "name": "Sortear um lugar", "short_name": "Sortear", "url": "./#/?draw=1", "icons": [{ "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png" }] }
  ]
  ```
- **`css/app.css`:** layout da linha da ordenação com os dois botões (`justify-content: space-between`) e o espaço do card dentro do painel. Use só variáveis de cor.
- Não há arquivo novo, então `sw.js` não muda.

## Critérios de aceite
- [ ] Com cards na aba, a linha acima da lista mostra "Ordenar: … ▾" à esquerda e "🎲 Sortear" à direita. Com a aba vazia ou sem resultado, a linha some.
- [ ] Ao tocar em "Sortear", abre o painel "Sorteado!" com o card de um dos lugares visíveis.
- [ ] Dado "Já fui" com os filtros "voltaria = sim" e nota mínima 4, mostrando 3 lugares, os sorteios saem sempre entre esses 3.
- [ ] "Sortear de novo" troca para um lugar diferente do anterior. Com um só lugar visível, o botão fica desabilitado.
- [ ] "Ver lugar" (ou tocar no card) abre o detalhe do lugar sorteado. Voltar do detalhe leva à tela inicial com a mesma aba, busca e filtros.
- [ ] O voltar do Android, com o painel aberto, fecha só o painel.
- [ ] No celular, segurar o ícone do app instalado mostra os atalhos "Novo" e "Sortear".
- [ ] O atalho "Novo" abre o cadastro de lugar.
- [ ] O atalho "Sortear" abre a tela inicial em "Quero ir" já com o painel do sorteio. Com "Quero ir" vazio, abre a tela inicial e avisa que não há lugares para sortear.

## Como testar
**Validação manual (usuário)**
1. Com 3 ou mais lugares em cada aba, confira a linha "Ordenar / Sortear". Busque um nome que não existe e veja a linha sumir (critério 1).
2. Toque em "Sortear" e depois em "Sortear de novo" várias vezes (critérios 2 e 4).
3. Em "Já fui", aplique "voltaria = sim" e nota mínima 4 e sorteie várias vezes (critério 3). Filtre até sobrar 1 lugar e confira o botão desabilitado (critério 4).
4. Toque em "Ver lugar" e volte (critério 5). Abra o painel e aperte o voltar do Android (critério 6).
5. No celular, com o app publicado e instalado, segure o ícone (critério 7). O Android pode levar um tempo para atualizar os atalhos; se não aparecerem, reinstale o app pela tela inicial. Teste os dois atalhos (critérios 8 e 9).
6. Para o caso vazio: num navegador de teste sem lugares em "Quero ir", abra `#/?draw=1` (critério 9).

**Testes automatizados (quem implementa)**
- `js/services/lists.test.js` para `pickRandom`, com `random` controlado:
  - lista vazia devolve `null`;
  - 1 item devolve esse item, mesmo sendo o `excludeId`;
  - com 2 ou mais itens, nunca devolve o `excludeId`;
  - com `random` devolvendo 0 e 0,999, pega o primeiro e o último.
- Comando: `node --test`.

## Observações
- O sorteio não grava nada (RN22).
- O atalho "Sortear" ignora de propósito os filtros que estavam na última visita à tela: ele é um atalho rápido para o "Quero ir" inteiro.

## Pendências
- [CARD-031 — Backup pelo compartilhar](../08-v1-1-configuracoes/CARD-031-backup-pelo-compartilhar.md): fecha a release v1.1. Este card é da v1.2.

## Justificativa da complexidade e do modelo
- **Complexidade M:** uma função pura, um painel novo, a query `draw` e o manifest.
- **Modelo sonnet:** funcionalidade típica, de incerteza baixa, com componentes já existentes (`openBottomSheet`, `renderCard`).

## Fora do escopo
- Sortear com pesos (por exemplo, favoritos com mais chance) ou histórico de sorteios.
- Atalho para Configurações (não escolhido).
- Abrir no Maps e compartilhar (CARD-032).

## Referências
- RF26, RF27, RN22, Fluxo 7 e a tela T9 — `docs/refinamento.md`
- `js/ui/screens/home.js` (`sortRow`, `renderCard`, `visible`), `js/services/lists.js`, `js/ui/components/bottom-sheet.js`, `js/router.js` (`setQuery`), `manifest.webmanifest`
