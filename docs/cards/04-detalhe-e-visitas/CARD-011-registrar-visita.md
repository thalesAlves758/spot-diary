---
id: CARD-011
titulo: "Registrar visita"
contexto: detalhe-visitas
tipo: feature
camadas: [front, banco]
complexidade: M
prioridade: mvp
incerteza: baixa
status: todo
requisitos: [RF04, RN04, RN05]
depende_de: [CARD-010]
---

# CARD-011 — Registrar visita

## Contexto
O coração do app: registrar uma ida ao lugar. A primeira visita move o lugar de "Quero ir" para "Já fui".

## O que fazer
- Tela T5 em `#/lugar/:id/visita/nova`: data* (padrão hoje, máximo hoje), nota* (5 estrelas), "voltaria?"* (sim/não, sem padrão) e comentário.
- `js/services/visitas.js` → `registrarVisita(lugarId, dados)`:
  - valida a RN05 (data não futura, nota inteira de 1 a 5, "voltaria" obrigatório)
  - grava a visita e, se o lugar estiver em `quero_ir`, muda para `ja_fui` na mesma transação, atualizando `atualizadoEm`
- Após salvar, volta ao detalhe com toast.

## Critérios de aceite
- [ ] Dado um lugar `quero_ir` sem visitas, quando registro uma visita válida, então ela aparece no histórico e o lugar passa para "Já fui" (RF04, RN04).
- [ ] Dado um lugar `ja_fui`, quando registro outra visita, então o status não muda e a média é recalculada.
- [ ] Dado data futura, nota ausente ou "voltaria" não escolhido, então aparece erro e nada é gravado (RN05).
- [ ] Dado uma falha na gravação, então nem a visita nem a mudança de status ficam salvas.

## Notas técnicas
Data salva como `YYYY-MM-DD` no fuso local. Não gerar "hoje" com `toISOString()`, que converte para UTC e pode virar o dia seguinte à noite.

## Fora do escopo
Edição e exclusão de visita (CARD-012).

## Justificativa da complexidade
M: formulário, validação e transação envolvendo duas stores.
