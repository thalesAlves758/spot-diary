---
id: CARD-018
titulo: "Lembrete de backup"
contexto: backup
tipo: feature
camadas: [front]
complexidade: P
prioridade: mvp
incerteza: baixa
status: todo
requisitos: [RF14, RN12, RNF-durabilidade]
depende_de: [CARD-008, CARD-016]
---

# CARD-018 — Lembrete de backup

## Contexto
Ninguém lembra de fazer backup sozinho; o app avisa.

## O que fazer
- Ao abrir a T1, mostrar o lembrete se o último export tiver mais de 30 dias ou se nunca houve export e existe pelo menos 1 lugar.
- Banner "Faz tempo que você não faz backup" com "Exportar agora" (`#/backup`) e "Depois" (esconde até a próxima abertura do app).

## Critérios de aceite
- [ ] Dado o último export há 31 dias, quando abro o app, então vejo o banner (RF14, RN12).
- [ ] Dado o último export há 10 dias, então não vejo o banner.
- [ ] Dado que nunca exportei e existe 1 lugar, então vejo o banner; sem lugares, não vejo.

## Justificativa da complexidade
P: uma checagem de data e um banner.
