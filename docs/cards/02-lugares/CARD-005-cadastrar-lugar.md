---
id: CARD-005
titulo: "Cadastrar lugar"
contexto: lugares
tipo: feature
camadas: [front, banco]
complexidade: M
prioridade: mvp
incerteza: baixa
status: todo
requisitos: [RF01, RN01, RN02, RN10]
depende_de: [CARD-002, CARD-004]
---

# CARD-005 — Cadastrar lugar

## Contexto
Primeira fatia de ponta a ponta: o usuário cadastra um lugar que quer conhecer (tela T3 em modo criação).

## O que fazer
- Tela T3 em `#/lugar/novo` com:
  - nome* e tipo* (select com a lista da RN02)
  - tags (chips simples; autocomplete fica no CARD-006)
  - endereço em campos separados: logradouro, número, complemento, bairro, cidade, UF (select com as 27 siglas)
- `js/services/lugares.js`:
  - constante `TIPOS` = Bar, Restaurante, Pizzaria, Hamburgueria, Café, Lanchonete, Balada, Outro
  - `criarLugar(dados)`: valida obrigatórios, aplica `trim` no nome, bloqueia nome duplicado, define `status = 'quero_ir'` e `favorito = false`, monta `endereco` só com os campos preenchidos
- Ao salvar: toast de sucesso e navega para o detalhe do lugar.

## Critérios de aceite
- [ ] Dado o formulário com nome e tipo, quando salvo, então o lugar é gravado com status `quero_ir` (RF01).
- [ ] Dado nome ou tipo vazio, quando salvo, então o campo mostra erro e nada é gravado (RN01).
- [ ] Dado que existe "Bar do Zé", quando tento cadastrar " bar do zé ", então aparece "Nome já cadastrado" e nada é gravado (RN10).
- [ ] Dado endereço só com cidade e UF, quando salvo, então `endereco` contém apenas esses dois campos.

## Notas técnicas
- Checagem de nome único em `services/`: compara `nome.trim().toLowerCase()` com os nomes existentes (a base é pequena).
- Formato do registro conforme o modelo de dados do refinamento.

## Fora do escopo
Edição e exclusão (CARD-007), autocomplete de tags (CARD-006), botão "Novo" na aba "Já fui" (CARD-013).

## Justificativa da complexidade
M: formulário com vários campos, validações e primeira regra de negócio em `services/`.
