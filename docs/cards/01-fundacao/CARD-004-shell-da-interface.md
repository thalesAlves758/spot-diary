---
id: CARD-004
titulo: "Shell da interface e componentes base"
contexto: fundacao
tipo: setup
camadas: [front]
complexidade: M
prioridade: mvp
incerteza: baixa
status: todo
requisitos: [RNF-usabilidade]
depende_de: [CARD-001]
---

# CARD-004 — Shell da interface e componentes base

## Contexto
Navegação entre telas, estilo base mobile-first e componentes reutilizados por todos os cards de tela.

## O que fazer
- `js/router.js`: roteamento por hash com as rotas:
  - `#/` início · `#/place/new` · `#/place/:id` · `#/place/:id/edit`
  - `#/place/:id/visit/new` · `#/visit/:id/edit` · `#/backup`
- `css/app.css`: variáveis de cor, espaçamento e fonte; áreas de toque com no mínimo 44 px.
- Componentes em `js/ui/components/`: cabeçalho, modal de confirmação (retorna `Promise<boolean>`), toast, estado vazio e painel inferior (bottom sheet, usado nos filtros).
- Telas placeholder para cada rota.

## Critérios de aceite
- [ ] Dado qualquer rota, quando uso o botão voltar do Android, então volto para a tela anterior.
- [ ] O modal de confirmação resolve `true` ao confirmar e `false` ao cancelar.
- [ ] Nenhuma tela tem rolagem horizontal em 360 px de largura.

## Notas técnicas
`ui/` só chama `services/`; nenhum acesso direto a `db/`.

## Fora do escopo
Conteúdo real das telas (cards seguintes).

## Justificativa da complexidade
M: roteador, estilo base e cinco componentes reutilizáveis.
