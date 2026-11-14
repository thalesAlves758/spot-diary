---
id: CARD-040
titulo: "Tags fixadas na tela inicial"
contexto: olhar-para-tras
tipo: feature
camadas: [front]
complexidade: M
prioridade: mvp
incerteza: baixa
modelo_sugerido: sonnet
status: todo
requisitos: [RF33, RN29, RF10]
depende_de: [CARD-039]
---

# CARD-040 — Tags fixadas na tela inicial

## Contexto
Os "grupos" de lugares ("com a dona", "aniversário") já cabem nas tags: um lugar pode ter várias, e o filtro por tag já existe. Falta o acesso rápido. Hoje é preciso abrir o painel de filtros e marcar a tag. O CARD-034 já criou `js/services/pinned-tags.js` (`getPinnedTags`, `setPinnedTags`, `cleanPinnedTags`), e as tags fixadas já entram no backup.

## Objetivo
Fixar tags pelo painel de filtros (painel T10, "Fixar na tela inicial"). Cada tag fixada vira um chip no topo da tela inicial, que liga ou desliga o filtro daquela tag com um toque.

## Detalhamento técnico
- **`js/services/pinned-tags.js`:**
  - `async togglePinnedTag(tag)`: fixa a tag se ela não estiver fixada e desfixa se estiver (sem diferenciar maiúsculas). Grava e devolve a lista nova.
  - `visiblePinnedTags(pinned, allTags)` (pura): as tags fixadas que existem em algum lugar, com a grafia de `allTags`, em ordem alfabética pt-BR. Uma tag fixada que deixou de existir não aparece, mas continua na lista gravada (RN29).
  - `isPinned(tag, pinned)` (pura).
- **`js/ui/screens/home.js`:**
  - **Linha de chips:** logo abaixo da barra de busca, dentro de `.home-bar`, com rolagem horizontal e sem quebra de linha.
    - Um botão por tag de `visiblePinnedTags`, com `aria-pressed` refletindo se a tag está em `filters.tags` (sem diferenciar maiúsculas).
    - Tocar adiciona ou remove a tag de `filters.tags` e chama `update()`. Isso atualiza a lista, o indicador de filtros e a URL, como o painel faz.
    - A linha some quando `visiblePinnedTags` está vazia.
  - **Painel de filtros** (`openFilterSheet`): na seção "Tags", um botão de link "Fixar na tela inicial" (ícone `pin`) abre o painel T10 **por cima** do painel de filtros, que continua aberto por baixo com o rascunho intacto. Sem tags cadastradas, a seção inteira continua oculta.
  - **Painel T10** (`openPinSheet`): usa `openBottomSheet` com o título "Fixar na tela inicial", sem rodapé.
    - Lista todas as tags em ordem alfabética, cada uma com um botão de alfinete (`aria-pressed`, 44 px) que chama `togglePinnedTag` na hora.
    - Ao fechar o T10 (X, toque fora ou voltar do Android), você volta ao painel de filtros. A linha de chips da tela inicial é redesenhada com a lista nova.
  - **Na abertura da tela:** carregue `getPinnedTags()` junto com `loadHomeLists()`, em paralelo.
- **`css/app.css`:** a linha de chips com rolagem lateral (`overflow-x: auto`, sem barra visível no celular), o chip ativo com a cor primária e o item da lista do T10. Use só variáveis de cor.

## Critérios de aceite
- [ ] No painel de filtros, a seção Tags tem o link "Fixar na tela inicial", que abre a lista de tags com um alfinete em cada uma.
- [ ] Fixar "com a dona" e "aniversário" faz os dois chips aparecerem no topo da tela inicial, em ordem alfabética, logo abaixo da busca.
- [ ] Ao tocar no chip "com a dona", a lista mostra só os lugares com essa tag, o chip fica destacado, o indicador de filtros conta 1 e a tag aparece marcada no painel de filtros.
- [ ] Tocar de novo no chip desliga o filtro.
- [ ] Os chips valem nas duas abas e continuam aplicados ao abrir um lugar e voltar.
- [ ] Sem nenhuma tag fixada, a linha de chips não aparece.
- [ ] Dado que tiro a tag "aniversário" de todos os lugares, o chip some. Se volto a usar a tag, o chip reaparece sem eu fixar de novo.
- [ ] Fechar a lista de fixar (inclusive com o voltar do Android) volta para o painel de filtros, sem perder o que eu já tinha marcado nele.
- [ ] As tags fixadas voltam depois de exportar e importar o backup (inclusive em outro navegador, com "Substituir tudo").
- [ ] Com muitas tags fixadas, a linha rola para o lado sem quebrar o layout em 360 px.

## Como testar
**Validação manual (usuário)**
1. Abra os filtros, toque em "Fixar na tela inicial" e fixe duas tags (critérios 1 e 2).
2. Feche a lista com o voltar do Android e confira que o painel de filtros continua aberto, com o rascunho (critério 8).
3. Toque nos chips na tela inicial e confira a lista, o indicador e o painel de filtros. Troque de aba, abra um lugar e volte (critérios 3, 4 e 5).
4. Desfixe todas as tags (critério 6).
5. Fixe uma tag, remova-a de todos os lugares e depois coloque de volta em um (critério 7).
6. Exporte o backup e importe com "Substituir tudo" num navegador de teste (critério 9).
7. Fixe 8 ou mais tags e confira a rolagem no modo celular do DevTools (critério 10).

**Testes automatizados (quem implementa)**
- `js/services/pinned-tags.test.js`: `visiblePinnedTags` (some quando a tag não existe, grafia de `allTags`, ordem alfabética, sem diferenciar maiúsculas) e `isPinned`.
- Comando: `node --test`.

## Observações
- A tag fixada é só um atalho do filtro de tags que já existe (RF10). O mesmo estado vale no chip, no painel e no indicador.

## Pendências
- [CARD-039 — Estatísticas](CARD-039-estatisticas.md). Os dois editam `js/ui/screens/home.js` e `css/app.css`, por isso rodam em sequência.

## Justificativa da complexidade e do modelo
- **Complexidade M:** uma linha nova na tela inicial, um painel por cima de outro e a integração com o estado dos filtros.
- **Modelo sonnet:** funcionalidade típica, de incerteza baixa, reaproveitando o filtro de tags e o `openBottomSheet`.

## Fora do escopo
- Grupos de verdade, como entidade própria (descartados em favor das tags fixadas).
- Reordenar as tags fixadas à mão ou fixar outros filtros (tipo, preço).

## Referências
- RF33, RN29, RF10 e as telas T1, T2 e T10 — `docs/refinamento.md`
- `js/services/pinned-tags.js`, `js/services/filters.js`, `js/services/places.js` (`uniqueTags`), `js/ui/screens/home.js` (`openFilterSheet`, `update`), `js/ui/components/bottom-sheet.js`
