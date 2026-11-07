---
id: CARD-010
titulo: "Detalhe do lugar"
contexto: detalhe-visitas
tipo: feature
camadas: [front]
complexidade: M
prioridade: mvp
incerteza: baixa
status: todo
requisitos: [RF06, RN08]
depende_de: [CARD-008]
---

# CARD-010 — Detalhe do lugar

## Contexto
Tela T4: tudo sobre um lugar e o ponto de partida para registrar visitas.

## O que fazer
- `#/place/:id`: nome, tipo, tags, endereço formatado só com os campos preenchidos, coração.
- Resumo com média, nº de visitas e "voltaria" da última (`placeSummary`).
- Histórico de visitas por data decrescente (empate: `createdAt` decrescente), cada uma com data, estrelas, "voltaria" e comentário.
- Ações: "Registrar visita" (CARD-011), "Editar lugar" (CARD-007) e editar/excluir visita (CARD-012).
- Estados:
  - `want_to_go` sem visitas: "Você ainda não foi aqui" + botão de registrar
  - `been_there` sem visitas (todas excluídas): "Nenhuma visita registrada"
  - id inexistente: mensagem e volta ao início

## Critérios de aceite
- [ ] Dado um lugar com 3 visitas, então o histórico mostra a mais recente primeiro e a média com uma casa decimal (RF06).
- [ ] Dado um lugar `been_there` sem visitas, então aparece "Nenhuma visita registrada" e o lugar segue em "Já fui".
- [ ] Dado endereço só com cidade e UF, então aparece "Cidade - UF", sem separadores sobrando.

## Justificativa da complexidade
M: tela com várias seções e estados.
