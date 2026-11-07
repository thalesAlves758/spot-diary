---
id: CARD-023
titulo: "Busca de lugar no mapa"
contexto: evolucao
tipo: integracao
camadas: [front, integracao]
complexidade: M
prioridade: depois
incerteza: media
status: todo
requisitos: [RF16]
depende_de: [CARD-022]
---

# CARD-023 — Busca de lugar no mapa

## Contexto
Preencher o cadastro a partir de uma busca de lugares, conforme o spike.

## O que fazer
- No T3, buscar por nome, escolher um resultado e preencher nome, endereço e coordenadas.
- Sem internet, o cadastro manual continua funcionando normalmente.

## Critérios de aceite
- [ ] Dado conexão ativa, quando busco "Bar do Zé" e escolho um resultado, então nome e endereço são preenchidos.
- [ ] Dado o modo avião, então a busca fica indisponível e o cadastro manual funciona.

## Justificativa da complexidade
M: o escopo final depende do serviço escolhido no spike.
