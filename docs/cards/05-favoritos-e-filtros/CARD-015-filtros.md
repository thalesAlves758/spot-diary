---
id: CARD-015
titulo: "Filtros (tipo, tags, favoritos, voltaria, nota mínima)"
contexto: descoberta
tipo: feature
camadas: [front]
complexidade: M
prioridade: mvp
incerteza: baixa
status: todo
requisitos: [RF10, RN07, RN08, RNF-performance]
depende_de: [CARD-006, CARD-009, CARD-011, CARD-014]
---

# CARD-015 — Filtros (tipo, tags, favoritos, voltaria, nota mínima)

## Contexto
Responder "onde a gente vai hoje?": combinar critérios para achar os lugares que você curtiu.

## O que fazer
- Painel inferior T2 aberto pelo botão de filtros da T1, que mostra quantos filtros estão ativos.
- Critérios: tipos (múltipla escolha), tags (múltipla escolha; seção oculta sem tags), "só favoritos". Só na aba "Já fui": "voltaria = sim" e nota mínima de 1 a 5.
- Semântica: OU entre opções do mesmo critério, E entre critérios diferentes.
- "Voltaria" olha a visita mais recente (RN07); nota mínima compara com a média (RN08); lugar `ja_fui` sem visitas fica fora desses dois filtros.
- Combina com a busca; "Limpar" zera tudo; os filtros valem ao trocar de aba (os exclusivos de "Já fui" são ignorados em "Quero ir").
- `services/filtros.js`: `aplicarFiltros(lugaresComResumo, filtros)`, função pura.

## Critérios de aceite
- [ ] Dado lugares em "Já fui" com notas e respostas variadas, quando ativo "voltaria = sim" e nota mínima 4, então só aparecem lugares cuja última visita tem "voltaria = sim" e média ≥ 4 (RF10).
- [ ] Dado Bar e Pizzaria selecionados, então aparecem lugares de qualquer um dos dois tipos.
- [ ] Dado "só favoritos" e a tag "BH", então aparecem só favoritos com a tag "BH".
- [ ] Dado um lugar `ja_fui` sem visitas, quando a nota mínima está ativa, então ele não aparece.
- [ ] Com 1.000 lugares, aplicar filtros leva menos de 200 ms (referência).

## Justificativa da complexidade
M: vários critérios combináveis e regras de negócio específicas.
