# Calculadora de Astrofísica

Ferramenta em HTML/JS para planear a evolução da pesquisa **Astrofísica** em OGame, tendo em conta:

- custo dos níveis (ou intervalo de níveis),
- recursos atuais e produção diária,
- limites de armazéns e bónus,
- frota abatida e destroços gerados,
- trocas de recursos e uso de Matéria Negra.

Tudo corre 100% no browser, sem backend.

---

## ✨ Funcionalidades

### Astrofísica

- Introdução de **nível inicial** e **nível final** de Astrofísica.
- Cálculo do **custo total** em:
  - Metal  
  - Cristal  
  - Deutério  
- Se só for definido o nível final, calcula o custo desse nível isolado.
- Os valores são usados como alvo para todos os restantes cálculos (faltas, trocas, etc.).

### Recursos & Produção

- Campos para **recursos atuais**:
  - Metal atual  
  - Cristal atual  
  - Deutério atual  
- Campos para **produção diária**:
  - Produção de metal/dia  
  - Produção de cristal/dia  
  - Produção de deutério/dia  
- Os inputs aceitam números grandes com “espaços” como separador de milhares (ex.: `1 234 567`).

### Armazéns & Configuração

- Níveis de:
  - Armazém de Metal  
  - Armazém de Cristal  
  - Armazém de Deutério  
- Cálculo automático da **capacidade de cada armazém**, com:
  - bónus de armazém configurável (%),
  - **classe de aliança** (ex.: mercante com bónus de armazéns).
- Definição das **taxas de troca**:
  - Metal : Cristal : Deutério (ex.: `3 : 2 : 1`).
- Configuração opcional de **Matéria Negra**:
  - DM por pacote
  - DM por troca

### Frota para Abate (Destroços)

- Escolha do tipo de nave (caças, cruzadores, RIPs, sondas, recs, etc.).
- Introdução da quantidade a abater para cada tipo.
- Configuração da **% de destroços** (ex.: 70%).
- Cálculo automático de:
  - destroços gerados em Metal, Cristal e Deutério,
  - pontos perdidos ao abater a frota.

### Conversão de Excedentes

- Se existirem **recursos em falta** para o objetivo e **recursos em excesso** noutros tipos:
  - possibilidade de escolher “converter de” e “converter para” (Metal ⇄ Cristal ⇄ Deutério),
  - simulação da conversão em função das taxas definidas,
  - atualização das faltas após a conversão.
- Quando os valores de frota/recursos são alterados e o utilizador volta a calcular,
  as conversões anteriores deixam de ser consideradas e é feito um **novo cálculo limpo**.

### KPIs & Resumos

Na coluna direita são mostrados vários resumos:

- **Metal em falta (MSU)** – faltas convertidas para “equivalente em metal”.
- **Produção diária (MSU)** – produção total em metal equivalente.
- **Dias até lá** – estimativa de tempo para atingir o objetivo com a produção atual.
- **Pontos perdidos** – pontos sacrificados ao abater a frota definida.

E ainda blocos com:

- detalhe das faltas e excedentes por recurso,
- totais de recursos (incluindo destroços),
- verificação de capacidade dos armazéns (avisos se exceder),
- trocas recomendadas (quantidade e “metal equivalente”),
- estimativa de pacotes de DM necessários (se preenchido),
- notas finais.

---

## 🧱 Stack & Estrutura

Projeto simples, estático:

- **HTML**: estrutura da página e cards (esquerda: inputs; direita: resultados).
- **CSS** (`styles.css`):
  - layout em duas colunas,
  - temas (`neon`, `carbon`, `light`),
  - grelhas (`.grid-2`, `.grid-3`, `.grid-4`),
  - componentes (cards, KPIs, tabelas, “pills” de aviso).
- **JavaScript** (`script.js`):
  - gestão de tema e estado no `localStorage`,
  - formatação e parsing de números,
  - cálculo de capacidade de armazéns,
  - cálculo de custos de Astrofísica (intervalo de níveis),
  - gestão da frota e cálculo de destroços,
  - lógica de conversão de excedentes,
  - cálculo final (faltas, MSU, dias, DM, etc.).

Estrutura típica do repo:

```text
.
├── index.html
├── styles.css
└── script.js

Copyright (c) 2025 @ Wezen [Cosmos.PT | Himalia.PT]
