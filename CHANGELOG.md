# Changelog

Cada versão publicada do Diário de Rolê tem uma seção, da mais recente para a mais antiga, com a data da release e o que mudou. A versão segue `MAIOR.MENOR.CORREÇÃO` (RN19).

## 1.1.0 — 2026-11-14

Configurações.

- **Tela de Configurações** no lugar da tela Backup, aberta pela engrenagem da tela inicial, com as seções Aparência, Backup, Dados e Sobre (versão do app). O link antigo `#/backup` leva para Configurações.
- **Tema escuro:** escolha entre Automático (segue o celular), Claro e Escuro, salva no aparelho e aplicada desde a abertura, sem piscar.
- **Backup pelo compartilhar:** além de "Baixar arquivo", o botão "Compartilhar" manda o backup direto para o Drive, WhatsApp ou e-mail, como `diario-de-role-AAAA-MM-DD.json.txt`. O "Importar" aceita também arquivos `.txt`.
- A versão do app passa a aparecer em Configurações, e os testes automatizados rodam no GitHub Actions.

## 1.0.0 — 2026-11-08

Primeira versão publicada (MVP).

- **Lugares:** cadastro com nome, tipo, tags e endereço; edição e exclusão (a exclusão leva as visitas junto, com confirmação); favoritos.
- **Visitas:** registro com data, nota de 1 a 5, "voltaria?" e comentário; edição e exclusão. A primeira visita leva o lugar de "Quero ir" para "Já fui".
- **Abas** "Quero ir" e "Já fui", com contador.
- **Busca** por nome, sem diferenciar maiúsculas nem acentos.
- **Filtros** por tipo, tags e favoritos; em "Já fui", também por "voltaria" e nota mínima.
- **Ordenação** por aba, com a escolha salva no aparelho.
- **Backup:** exportar em JSON e importar, mesclando ou substituindo tudo.
- **Lembrete de backup** quando o último tem mais de 30 dias.
- **Apagar todos os dados**, com confirmação em dois passos.
- App instalável, que funciona offline e avisa quando há versão nova.
