---
id: CARD-013
titulo: "Botão \"Novo\" na aba \"Já fui\""
contexto: detalhe-visitas
tipo: feature
camadas: [front]
complexidade: P
prioridade: mvp
incerteza: baixa
status: todo
requisitos: [RF01, RF04]
depende_de: [CARD-005, CARD-011]
---

# CARD-013 — Botão "Novo" na aba "Já fui"

## Contexto
Para o lugar que você foi sem planejar (Fluxo 2): cadastrar e já registrar a visita em sequência.

## O que fazer
- O botão "Novo" na aba "Já fui" abre o T3 com um indicador (ex.: `#/place/new?beenThere=1`).
- Ao salvar o lugar, navega direto para o T5 do lugar recém-criado.
- Ao salvar a visita, vale a regra do CARD-011 (lugar vai para "Já fui") e o app abre o detalhe.
- Se o usuário sair do T5 sem salvar, o lugar fica em "Quero ir".

## Critérios de aceite
- [ ] Dado a aba "Já fui", quando toco em "Novo", cadastro o lugar e salvo a visita, então o lugar aparece em "Já fui" com 1 visita.
- [ ] Dado que saio do registro da visita sem salvar, então o lugar existe em "Quero ir".

## Justificativa da complexidade
P: só encadeia telas e regras que já existem.
