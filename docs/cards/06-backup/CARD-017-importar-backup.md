---
id: CARD-017
titulo: "Importar backup (substituir ou mesclar)"
contexto: backup
tipo: feature
camadas: [front, banco]
complexidade: M
prioridade: mvp
incerteza: media
status: done
requisitos: [RF13, RN11]
depende_de: [CARD-016]
---

# CARD-017 — Importar backup (substituir ou mesclar)

## Contexto
Restaurar dados num celular novo ou juntar backups, sem corromper o que já existe.

## O que fazer
- Botão "Importar" na T6 → `<input type="file" accept="application/json">`.
- Validar tudo antes de gravar:
  - JSON válido, `app === 'diario-de-role'`, `schemaVersion` compatível (≤ versão atual)
  - lugares e visitas com campos obrigatórios e tipos corretos
  - toda visita aponta para um lugar do arquivo ou do app
- Mostrar resumo ("X lugares, Y visitas") e a escolha "Mesclar" / "Substituir tudo" (este com confirmação extra).
- Substituir: limpa as stores e grava o arquivo inteiro.
- Mesclar: casa por `id`; em conflito vence o maior `updatedAt`; lugar com nome já existente e `id` diferente é ignorado, junto com suas visitas, e listado no resultado.
- Tudo numa transação: qualquer erro desfaz a operação inteira.
- Resultado final: inseridos, atualizados e ignorados (com nomes).

## Critérios de aceite
- [ ] Dado um backup com lugares de mesmo `id`, quando mesclo, então não há duplicados e vence a versão editada mais recentemente (RF13).
- [ ] Dado um arquivo que não é backup do app, quando importo, então aparece erro e nenhum dado muda (RF13).
- [ ] Dado "Substituir tudo" confirmado, então o app fica exatamente com os dados do arquivo.
- [ ] Dado "Bar do Zé" no arquivo com `id` diferente do existente, então ele e suas visitas não entram e aparecem listados no resultado (RN11).

## Notas técnicas
Deixar um gancho `migrateBackup(data)` para converter versões antigas quando o esquema mudar.

## Justificativa da complexidade
M: validação e duas estratégias de gravação. Se crescer, separar "substituir" e "mesclar" em dois cards.
