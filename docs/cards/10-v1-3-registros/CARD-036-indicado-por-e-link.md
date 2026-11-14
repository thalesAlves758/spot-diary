---
id: CARD-036
titulo: "Indicado por e link do lugar"
contexto: registros
tipo: feature
camadas: [front]
complexidade: M
prioridade: mvp
incerteza: baixa
modelo_sugerido: sonnet
status: todo
requisitos: [RF29, RN24, RN25, RN21]
depende_de: [CARD-035]
---

# CARD-036 — Indicado por e link do lugar

## Contexto
Muitos lugares do "Quero ir" chegam por indicação de alguém, e quase todos têm um Instagram ou um site com cardápio. Hoje nada disso fica registrado. O CARD-034 já preparou:
- os campos `place.recommendedBy` e `place.link`;
- as funções `normalizeLink` (em `js/services/places.js`) e `normalizePerson` / `listPeople` (em `js/services/people.js`).

## Objetivo
Informar no cadastro do lugar quem indicou (com sugestões de nomes já usados) e um link. O detalhe mostra os dois, e o link abre ao toque.

## Detalhamento técnico
- **`js/services/places.js`, `validatePlace(data, existing, { ignoreId, people = [] })`:**
  - `recommendedBy`: `trim`; vazio vira `null`; até 80 caracteres (acima disso, `errors.recommendedBy = 'Use no máximo 80 caracteres'`). Normalize com `normalizePerson(nome, people)` para manter a grafia existente (RN24).
  - `link`: `normalizeLink(data.link)`; um `error` vira `errors.link = 'Link inválido'`. Grave o `value` normalizado.
  - `value.recommendedBy` e `value.link` são sempre definidos (`null` quando vazios), para que limpar na edição apague o valor.
  - `createPlace` e `updatePlace` carregam `listPeople()` e passam em `people`.
- **`js/ui/screens/place-form.js`:**
  - **"Indicado por":** depois das Tags, um `input` de texto com `<datalist>` alimentado por `listPeople()`, para o Chrome mostrar as sugestões. É opcional.
  - **"Link":** depois de "Indicado por", um `input type="text"` com `inputmode="url"`, `autocapitalize="off"`, `autocomplete="off"` e o placeholder `instagram.com/… ou @perfil`. **Não** use `type="url"`, porque o navegador recusaria `@perfil`.
  - O erro "Link inválido" aparece embaixo do campo, como os outros erros do formulário. Na edição, os dois campos vêm preenchidos.
- **`js/ui/format.js`:**
  - `displayLink(url)`: o link sem `https://` ou `http://` e sem a `/` final (`https://instagram.com/bardoze` vira `instagram.com/bardoze`).
  - `placeShareText`: acrescenta o link do lugar como última linha, quando houver (RN21).
- **`js/ui/screens/place-detail.js`**, logo depois das tags:
  - "Indicado por {nome}", quando houver;
  - a linha do link: `h('a', { href: link, target: '_blank', rel: 'noopener' }, icon('link'), displayLink(link))`, com área de toque de 44 px.

## Critérios de aceite
- [ ] O cadastro e a edição do lugar têm os campos "Indicado por" e "Link", depois das Tags. Os dois são opcionais.
- [ ] Ao digitar em "Indicado por", aparecem como sugestão os nomes já usados (em outros lugares ou em "Com quem" das visitas, depois do CARD-037).
- [ ] Dado "Dona" já usado, quando digito "dona" e salvo, o detalhe mostra "Indicado por Dona".
- [ ] `instagram.com/bardoze` e `@bardoze` são aceitos e salvos como `https://instagram.com/bardoze`. Um texto como `bar do zé` mostra "Link inválido" e não salva.
- [ ] O detalhe mostra "Indicado por …" e o link sem o `https://`. Tocar no link abre o Instagram ou o navegador.
- [ ] Apagar o link (ou quem indicou) na edição e salvar remove a informação do detalhe.
- [ ] Compartilhar um lugar com link inclui o link no fim do texto.
- [ ] Os lugares que já existiam continuam funcionando, sem esses campos.

## Como testar
**Validação manual (usuário)**
1. Edite um lugar e preencha "Indicado por: Dona" e "Link: @bardoze". Salve e confira o detalhe (critérios 1, 4 e 5).
2. Em outro lugar, digite "do" em "Indicado por": a sugestão "Dona" aparece. Digite "dona" em minúsculas, salve e confira a grafia (critérios 2 e 3).
3. Tente o link `bar do zé` (critério 4). Toque no link do detalhe no celular (critério 5).
4. Apague o link, salve e confira o detalhe (critério 6). Compartilhe um lugar com link (critério 7).
5. Abra um lugar antigo, sem esses campos (critério 8).

**Testes automatizados (quem implementa)**
- `js/services/places.test.js`: `validatePlace` com link válido, inválido e vazio, e com `recommendedBy` normalizado pela grafia existente e com mais de 80 caracteres.
- `js/ui/format.test.js`: `displayLink`; `placeShareText` com link.
- Comando: `node --test`.

## Observações
- "Indicado por" é um nome só, em texto livre. A lista de sugestões é única e compartilhada com "Com quem" (RN24).

## Pendências
- [CARD-035 — Faixa de preço](CARD-035-faixa-de-preco.md). Os dois editam o formulário e o detalhe do lugar, por isso rodam em sequência.

## Justificativa da complexidade e do modelo
- **Complexidade M:** dois campos com validação, sugestões e exibição no detalhe e no texto compartilhado.
- **Modelo sonnet:** funcionalidade típica, de incerteza baixa. A regra do link já está pronta e testada no CARD-034.

## Fora do escopo
- Filtrar ou ordenar por quem indicou.
- Vários links por lugar ou prévia do link.
- "Com quem" na visita (CARD-037).

## Referências
- RF29, RN24, RN25, RN21 e as telas T3 e T4 — `docs/refinamento.md`
- `js/services/places.js`, `js/services/people.js`, `js/ui/screens/place-form.js`, `js/ui/screens/place-detail.js`, `js/ui/format.js`
