---
id: CARD-032
titulo: "Abrir no Maps e compartilhar lugar"
contexto: sair-de-casa
tipo: feature
camadas: [front]
complexidade: M
prioridade: mvp
incerteza: baixa
modelo_sugerido: sonnet
status: done
requisitos: [RF24, RF25, RN20, RN21, RNF-privacidade]
depende_de: [CARD-031]
---

# CARD-032 — Abrir no Maps e compartilhar lugar

## Contexto
Na hora de sair, duas ações faltam no detalhe do lugar: ir até lá e mandar o lugar para quem vai junto. O mapa e a busca de lugares foram descartados porque exigiriam chamadas externas. Já abrir o endereço no Google Maps e usar o menu de compartilhar do Android não exigem: o app só passa os dados para outro app, por ação do usuário.

## Objetivo
No detalhe do lugar (T4):
- um botão "Abrir no Maps", que abre o Google Maps buscando o nome e o endereço;
- um botão de compartilhar no cabeçalho, que envia um texto descrevendo o lugar.

## Detalhamento técnico
- **`js/ui/format.js`** (já é puro, sem DOM, e pode ser testado no Node). Adicione três funções:
  - `hasAddress(address)`: `true` quando algum campo de `ADDRESS_FIELDS` (de `js/services/places.js`) tem texto além de espaços.
  - `mapsSearchUrl(place)`: a busca é o nome mais as linhas de `formatAddress(place.address)`, separados por `, `.
    ```js
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([place.name, ...formatAddress(place.address)].join(', '))}`
    ```
  - `placeShareText(place, summary)`: o texto da RN21, com uma informação por linha e sem linhas vazias:
    1. `Bar do Zé (Bar)`: o nome e, entre parênteses, `placeTypeLabel(type)`. O preço entra no CARD-035.
    2. Só para "Já fui" com visitas: `★ 4,5 · 3 visitas · voltaria` ou `· não voltaria`, conforme a última visita. Use `formatAverage` e `plural`.
    3. O endereço: as linhas de `formatAddress` unidas por ` · `, só se houver endereço.
    4. O link de `mapsSearchUrl(place)`, só se houver endereço.
    - O link do lugar entra no CARD-036.
- **`js/ui/screens/place-detail.js`:**
  - **Cabeçalho:** `actions` passa a ser `[compartilhar, editar]`, com `iconButton({ name: 'share', label: 'Compartilhar lugar', onClick })`.
  - **Compartilhar:**
    - Se `navigator.share` existir, chame `navigator.share({ title: place.name, text: placeShareText(place, summary) })` e ignore o `AbortError`.
    - Se não existir (computador), use `navigator.clipboard.writeText(texto)` e mostre o toast "Texto copiado".
    - Qualquer outro erro mostra "Não foi possível compartilhar.".
  - **Abrir no Maps:** só quando `hasAddress(place.address)`. Logo abaixo do `<address>`, um link com aparência de botão:
    ```js
    h('a', { class: 'btn btn-ghost', href: mapsSearchUrl(place), target: '_blank', rel: 'noopener' }, icon('map-pin'), 'Abrir no Maps')
    ```
    No Android, o link universal abre o app do Maps quando ele está instalado.
- **`css/app.css`: não altere.** Use as classes existentes (`.btn`, `.btn-ghost`, `.btn-block`), para este card rodar em paralelo com o CARD-033. Se for indispensável algum estilo, explique no relatório.
- Os ícones `share` e `map-pin` já existem (CARD-029).
- Não há arquivo novo, então `sw.js` não muda.

## Critérios de aceite
- [ ] Num lugar com endereço, o detalhe mostra "📍 Abrir no Maps" logo abaixo do endereço. Num lugar sem nenhum campo de endereço, o botão não aparece.
- [ ] Ao tocar em "Abrir no Maps" no celular, abre o Google Maps (o app, se estiver instalado) já buscando o nome e o endereço do lugar.
- [ ] O cabeçalho do detalhe tem o botão de compartilhar ao lado do editar.
- [ ] Ao compartilhar um lugar "Já fui" com visitas, o texto tem: nome (tipo), "★ média · N visitas · voltaria" (ou "não voltaria", conforme a última visita), o endereço e o link do Maps, nessa ordem.
- [ ] Ao compartilhar um lugar "Quero ir" sem endereço, o texto tem só o nome e o tipo, sem linhas vazias.
- [ ] Fechar o menu de compartilhar sem escolher nada não mostra erro.
- [ ] No Chrome do computador, compartilhar copia o texto e mostra "Texto copiado".
- [ ] O app não faz nenhuma requisição de rede ao abrir o detalhe: confira em DevTools → Network.

## Como testar
**Validação manual (usuário)**
1. Cadastre "Bar do Zé" com rua, número, bairro, cidade e UF, registre duas visitas (a última com "voltaria = sim") e abra o detalhe (critérios 1 e 3).
2. No celular, toque em "Abrir no Maps" (critério 2).
3. Toque em compartilhar e envie para você mesmo no WhatsApp. Confira o texto (critério 4).
4. Cadastre um lugar "Quero ir" sem endereço, abra o detalhe e compartilhe (critérios 1 e 5).
5. Abra o compartilhar e feche sem escolher (critério 6).
6. No computador, toque em compartilhar e cole o texto num editor (critério 7).
7. Com DevTools → Network aberto, navegue pelo detalhe (critério 8).

**Testes automatizados (quem implementa)**
- `js/ui/format.test.js`:
  - `hasAddress` com endereço vazio, só espaços e um campo preenchido;
  - `mapsSearchUrl` com e sem endereço, e com caracteres especiais (acentos e `&`) codificados;
  - `placeShareText` para "Já fui" com visitas e "voltaria", com "não voltaria", "Já fui" sem visitas e "Quero ir" sem endereço, sempre sem linhas vazias.
- Comando: `node --test`.

## Observações
- O link do Maps é uma navegação feita por você, não uma chamada do app: a regra de privacidade continua valendo.
- O CARD-035 (preço) e o CARD-036 (link do lugar) vão acrescentar campos ao `placeShareText`.

## Pendências
- [CARD-031 — Backup pelo compartilhar](../08-v1-1-configuracoes/CARD-031-backup-pelo-compartilhar.md): fecha a release v1.1. Este card é da v1.2.

## Justificativa da complexidade e do modelo
- **Complexidade M:** três funções puras com testes e duas ações novas no detalhe.
- **Modelo sonnet:** funcionalidade típica, de incerteza baixa, com APIs conhecidas do navegador.

## Fora do escopo
- Mapa dentro do app, coordenadas ou busca de endereço (descartados).
- Compartilhar a lista inteira ou vários lugares.
- Sortear (CARD-033).

## Referências
- RF24, RF25, RN20, RN21, RNF "Privacidade" e a tela T4 — `docs/refinamento.md`
- `js/ui/screens/place-detail.js`, `js/ui/format.js`, `js/services/places.js` (`ADDRESS_FIELDS`, `placeTypeLabel`)
