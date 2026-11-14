---
id: CARD-037
titulo: "Com quem e pedidos/destaques na visita"
contexto: registros
tipo: feature
camadas: [front]
complexidade: M
prioridade: mvp
incerteza: baixa
modelo_sugerido: sonnet
status: todo
requisitos: [RF30, RN24, RN26]
depende_de: [CARD-036]
---

# CARD-037 — Com quem e pedidos/destaques na visita

## Contexto
Uma visita é lembrada pelas pessoas e pelo que se pediu ("o pastel de angu"). Hoje a visita só tem data, nota, "voltaria?" e comentário. O CARD-034 já preparou:
- os campos `visit.companions` (lista de nomes) e `visit.highlights` (texto);
- as funções de pessoas em `js/services/people.js` (`cleanPeople`, `normalizePerson`, `suggestPeople`, `listPeople`).

Os nomes de "Com quem" alimentam as estatísticas da v1.4.

## Objetivo
Registrar na visita com quem você foi (chips com sugestões) e os pedidos ou destaques (texto livre). O histórico do detalhe do lugar mostra os dois.

## Detalhamento técnico
- **`js/services/visits.js`:**
  - `export const HIGHLIGHTS_MAX = 500;`
  - **`validateVisit(data, { today, people = [] })`:**
    - `companions`: `cleanPeople((data.companions ?? []).map((n) => normalizePerson(n, people)))`, com no máximo 20 nomes de até 60 caracteres cada. Acima disso, `errors.companions`.
    - `highlights`: `trim`, com até `HIGHLIGHTS_MAX` caracteres (acima disso, `errors.highlights`).
    - `value.companions` é sempre um array, que pode ser vazio. `value.highlights` só entra quando não está vazio, como o `comment`.
  - `recordVisit` e `updateVisit` carregam `listPeople()` e passam em `people`. O `updateVisit` já reconstrói o registro a partir do `value`, então limpar os campos remove os valores.
- **`js/ui/components/tag-input.js`:** generalize para servir a pessoas sem mudar o comportamento das tags.
  - Novas opções: `normalize`, `suggest`, `clean` e `labels`. O padrão de cada uma é o comportamento atual das tags.
  - `labels` traz os textos acessíveis: o da lista de chips ("Tags adicionadas"), o das sugestões ("Tags já usadas") e o do botão de remover.
  - O `place-form.js` continua chamando `createTagInput` como hoje e precisa funcionar igual.
- **`js/ui/screens/visit-form.js`**, depois do "Voltaria?" e antes do comentário:
  - **"Com quem":** `createTagInput` com as funções de pessoas e a lista de `listPeople()`, com os rótulos "Pessoas adicionadas" e "Pessoas já usadas". O placeholder é "Nome e Enter".
  - **"Pedidos / destaques":** um `textarea` opcional, com contador ou limite de `HIGHLIGHTS_MAX` caracteres, como o comentário.
  - Na edição, os dois vêm preenchidos.
- **`js/ui/screens/place-detail.js`, histórico:** cada visita mostra, abaixo da linha de data, nota e "voltaria":
  - "com Dona, João", quando houver `companions`;
  - os destaques entre aspas, cortados em até 2 linhas (classe `.visit__highlights`).
- **`css/app.css`:** `.visit__highlights` com `display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;` e a cor `--color-muted` (ou outra variável).

## Critérios de aceite
- [ ] O registro e a edição de visita têm "Com quem" e "Pedidos / destaques", depois do "Voltaria?". Os dois são opcionais.
- [ ] Em "Com quem", Enter (ou vírgula) adiciona o nome como chip, o "x" remove, e aparecem sugestões de nomes já usados (inclusive de "Indicado por").
- [ ] Dado "Dona" já usado, quando adiciono "dona", o chip fica "Dona". O mesmo nome não entra duas vezes.
- [ ] O histórico do lugar mostra "com Dona, João" e os destaques entre aspas, cortados em 2 linhas quando o texto é longo.
- [ ] Editar a visita e remover as pessoas e os destaques os tira do histórico.
- [ ] O campo de tags do cadastro de lugar continua funcionando como antes.
- [ ] As visitas que já existiam continuam aparecendo normalmente.

## Como testar
**Validação manual (usuário)**
1. Registre uma visita com "Com quem: Dona, João" e um destaque longo (3 ou mais linhas). Confira o histórico (critérios 1, 2 e 4).
2. Em outra visita, digite "jo" em "Com quem": a sugestão "João" aparece. Adicione "dona" em minúsculas e depois "Dona" de novo (critérios 2 e 3).
3. Edite a visita, remova as pessoas e apague o destaque (critério 5).
4. Cadastre um lugar com tags, sugestões e remoção (critério 6). Abra um lugar antigo (critério 7).

**Testes automatizados (quem implementa)**
- `js/services/visits.test.js`: `validateVisit` com `companions` normalizados e sem repetição, `companions` ausente (vira `[]`), limite de nomes e de tamanho, e `highlights` vazio (não entra) e longo demais (erro).
- Comando: `node --test`.

## Observações
- Filtrar a tela inicial por pessoa ficou para depois. Por ora, as pessoas aparecem no histórico e nas estatísticas (CARD-039).

## Pendências
- [CARD-036 — Indicado por e link](CARD-036-indicado-por-e-link.md). Os dois editam `js/ui/screens/place-detail.js`, por isso rodam em sequência.

## Justificativa da complexidade e do modelo
- **Complexidade M:** validação nova, generalização de um componente reutilizado e exibição no histórico.
- **Modelo sonnet:** funcionalidade típica. O cuidado principal é não quebrar o campo de tags, coberto pelos critérios.

## Fora do escopo
- Filtro por pessoa na tela inicial (ficou para depois).
- Estatísticas de pessoas (CARD-039).
- Renomear ou juntar pessoas.

## Referências
- RF30, RN24, RN26 e as telas T4 e T5 — `docs/refinamento.md`
- `js/services/visits.js`, `js/services/people.js`, `js/ui/components/tag-input.js`, `js/ui/screens/visit-form.js`, `js/ui/screens/place-detail.js`
