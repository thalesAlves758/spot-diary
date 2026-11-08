---
id: CARD-014
titulo: "Favoritar lugar"
contexto: descoberta
tipo: feature
camadas: [front, banco]
complexidade: P
prioridade: mvp
incerteza: baixa
status: done
requisitos: [RF07, RN09]
depende_de: [CARD-008, CARD-010]
---

# CARD-014 — Favoritar lugar

## Contexto
A "lista VIP": marcar com um coração os lugares preferidos, em qualquer status.

## O que fazer
- Coração clicável no card (T1) e no detalhe (T4); alterna `favorite` e atualiza `updatedAt`.
- Funciona em "Quero ir" e em "Já fui".
- Tocar no coração do card não abre o detalhe.

## Critérios de aceite
- [ ] Dado um lugar não favorito em "Quero ir", quando toco no coração, então ele vira favorito e continua assim ao reabrir o app (RF07, RN09).
- [ ] Dado que favorito pelo detalhe, quando volto à lista, então o card também mostra o coração marcado.

## Justificativa da complexidade
P: um campo booleano e dois pontos de interação.
