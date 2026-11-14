---
id: CARD-031
titulo: "Backup pelo compartilhar"
contexto: configuracoes
tipo: feature
camadas: [front]
complexidade: P
prioridade: mvp
incerteza: media
modelo_sugerido: sonnet
status: todo
requisitos: [RF22, RN18]
depende_de: [CARD-030]
---

# CARD-031 — Backup pelo compartilhar

## Contexto
O maior risco do app é perder os dados, que vivem só no celular. Hoje o backup só baixa um `.json` para a pasta de downloads, de onde ele raramente sai. O Android tem o menu de compartilhar, que permite mandar o arquivo direto para o Google Drive, o WhatsApp ou o e-mail. O app não faz nenhuma chamada de rede: só passa o arquivo para o outro app.

## Objetivo
Na seção Backup de Configurações, ter dois botões: "Baixar arquivo" (o comportamento de hoje) e "Compartilhar", que abre o menu do Android com o arquivo de backup. A data do último backup só é registrada quando o envio é concluído.

## Detalhamento técnico
- **`js/ui/screens/settings.js`, painel de exportar:**
  - O botão "Exportar" atual passa a se chamar **"Baixar arquivo"**, sem mudar de comportamento.
  - Ao lado ou abaixo, vem o botão **"Compartilhar"** (ícone `share`), mostrado só se o navegador suporta compartilhar o arquivo. Teste uma vez, ao montar a tela, com `navigator.canShare?.({ files: [arquivoDeTeste] })`, usando um `File` vazio com o mesmo nome e tipo do arquivo real.
  - Ao tocar em "Compartilhar":
    1. Desabilite o botão e gere o texto com `buildBackup()` e `serializeBackup()` de `js/services/backup.js`.
    2. Crie o arquivo: `new File([texto], nome, { type })`, com o nome e o tipo definidos na Pendência abaixo.
    3. Chame `await navigator.share({ files: [file], title: 'Backup do Diário de Rolê' })`.
    4. **Sucesso:** `await markExported()`, atualize o texto "Último backup: …" e mostre o toast "Backup compartilhado".
    5. **`AbortError`** (você fechou o menu): não faça nada, nem toast, e não registre a data.
    6. **Outro erro:** toast "Não foi possível compartilhar. Tente de novo." e não registre a data.
    7. Por fim, reabilite o botão.
  - Os dois botões ficam com 44 px de altura e lado a lado em 360 px; se não couberem, um embaixo do outro.
- **Import:** se a Pendência for resolvida com a opção A, o `accept` do campo de arquivo de importar (hoje `application/json,.json`) passa a aceitar também `text/plain` e `.txt`. Assim, um backup compartilhado e baixado de volta do Drive pode ser importado. `parseBackup` já lê o conteúdo sem olhar a extensão.
- **`js/services/backup.js`:** se precisar, crie `backupShareFile(date)`, que devolve `{ name, type }` conforme a opção escolhida, para a regra não ficar dentro do handler. Nesse caso, teste a função.

## Critérios de aceite
- [ ] A seção Backup mostra os botões "Baixar arquivo" e "Compartilhar".
- [ ] "Baixar arquivo" funciona como o antigo "Exportar".
- [ ] Ao tocar em "Compartilhar" no celular, abre o menu de compartilhar do Android com o arquivo de backup.
- [ ] Dado que escolho o Google Drive (ou o WhatsApp) e o envio é concluído, a linha "Último backup" passa para agora e aparece "Backup compartilhado".
- [ ] Dado que fecho o menu sem escolher nada, "Último backup" não muda e nenhuma mensagem de erro aparece.
- [ ] O arquivo enviado, baixado de volta do Drive, é aceito em "Importar" e restaura os dados.
- [ ] Num navegador sem suporte a compartilhar arquivos (por exemplo, Chrome no Windows), o botão "Compartilhar" não aparece e "Baixar arquivo" continua funcionando.

## Como testar
**Validação manual (usuário)**
1. No celular, com o app publicado ou via *port forwarding* (`chrome://inspect`), abra Configurações (critério 1).
2. Toque em "Baixar arquivo" e confira o download (critério 2).
3. Toque em "Compartilhar": o menu abre com o arquivo (critério 3). Envie para o Drive (critério 4).
4. Toque de novo e feche o menu sem escolher (critério 5).
5. No Drive, baixe o arquivo e importe-o em Configurações com "Mesclar" (critério 6).
6. Abra o app no Chrome do computador e confira que só aparece "Baixar arquivo" (critério 7).

**Testes automatizados (quem implementa)**
- Se `backupShareFile` for criada: teste do nome e do tipo do arquivo.
- Comando: `node --test`.

## Observações
- O compartilhamento exige um toque do usuário (gesto). Não chame `navigator.share` fora do clique.
- O compartilhamento só funciona em HTTPS ou `localhost`, o que já é o caso do app.

## Pendências
- [CARD-030 — Tema escuro](CARD-030-tema-escuro.md). Os dois cards editam `js/ui/screens/settings.js`, por isso rodam em sequência.
- **Decidido em 14/11/2026 pelo usuário: opção A** (`.json.txt`, `text/plain`; o import aceita `.txt`; RN18 já ajustada no refinamento). Histórico da decisão:
- **Decisão antes de delegar (orquestradora com o usuário): o tipo do arquivo compartilhado.** O Chrome para Android só compartilha arquivos de uma lista de tipos permitidos, e `.json` / `application/json` provavelmente não está nela; nesse caso, `canShare` devolve `false` e o botão nunca aparece. Antes de delegar, confirme no celular, por exemplo com um teste rápido de `navigator.canShare` no console via `chrome://inspect`. Se `.json` não funcionar, decida:
  - **A (recomendada):** compartilhar como texto, `diario-de-role-AAAA-MM-DD.json.txt` (`text/plain`), com o mesmo conteúdo JSON. O import passa a aceitar `.txt`. Isso ajusta a RN18 (o nome do arquivo compartilhado muda) e precisa ser registrado no refinamento.
  - **B:** manter só o `.json`. Se o navegador não aceitar, o botão não aparece e a funcionalidade fica sem efeito no Android.

## Justificativa da complexidade e do modelo
- **Complexidade P:** um botão novo e uma chamada de API do navegador, num só arquivo de tela.
- **Modelo sonnet:** funcionalidade típica. A incerteza média vem do suporte do Chrome ao tipo de arquivo, resolvida na pendência antes de delegar.

## Fora do escopo
- Backup automático ou agendado.
- Compartilhar um lugar (CARD-032).
- Mudar o conteúdo ou o formato do JSON do backup.

## Referências
- RF22, RN18, Fluxo 4 — `docs/refinamento.md`
- `js/ui/screens/settings.js`, `js/services/backup.js`
