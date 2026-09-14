---
name: "PIB Jussara"
description: "Uma identidade pastoral em verdes institucionais, superfícies claras e hierarquia direta."
colors:
  green-950: "oklch(0.261 0.052 165.6)"
  green-900: "oklch(0.32 0.066 163.3)"
  green-800: "oklch(0.391 0.087 158.4)"
  green-700: "oklch(0.503 0.128 152.6)"
  brand-green: "oklch(0.682 0.183 145.4)"
  brand-lime: "oklch(0.798 0.227 136.8)"
  surface: "oklch(1 0 0)"
  surface-soft: "oklch(0.962 0.01 131.4)"
  background: "oklch(0.977 0.005 117.9)"
  text-primary: "oklch(0.227 0.026 164.7)"
  text-secondary: "oklch(0.506 0.017 157.8)"
  border: "oklch(0.913 0.015 145.4)"
typography:
  display:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 5.2vw, 4.5rem)"
    fontWeight: 800
    lineHeight: 1.02
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2rem, 3.6vw, 3.25rem)"
    fontWeight: 800
    lineHeight: 1.06
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: 1.4286
    letterSpacing: "normal"
  eyebrow:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.5
    letterSpacing: "0.18em"
rounded:
  sm: "0.5rem"
  md: "0.625rem"
  lg: "0.75rem"
  xl: "1rem"
  2xl: "1.25rem"
  3xl: "1.5rem"
spacing:
  "1": "0.25rem"
  "2": "0.5rem"
  "3": "0.75rem"
  "4": "1rem"
  "5": "1.25rem"
  "6": "1.5rem"
  "8": "2rem"
  "12": "3rem"
  "16": "4rem"
components:
  button-admin-primary:
    backgroundColor: "{colors.green-800}"
    textColor: "{colors.surface}"
    typography: "{typography.label}"
    rounded: "{rounded.xl}"
    padding: "0 1.25rem"
    height: "2.75rem"
  button-admin-primary-hover:
    backgroundColor: "{colors.green-700}"
    textColor: "{colors.surface}"
    typography: "{typography.label}"
    rounded: "{rounded.xl}"
    padding: "0 1.25rem"
    height: "2.75rem"
  button-admin-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.green-900}"
    typography: "{typography.label}"
    rounded: "{rounded.xl}"
    padding: "0 1rem"
    height: "2.75rem"
  input-admin:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    typography: "{typography.body}"
    rounded: "{rounded.xl}"
    padding: "0.25rem 0.75rem"
    height: "3rem"
  card-admin:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.2xl}"
    padding: "1.5rem"
  nav-admin-active:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.green-950}"
    typography: "{typography.label}"
    rounded: "{rounded.xl}"
    padding: "0.625rem 0.875rem"
    height: "2.75rem"
---

# Design System: PIB Jussara

## Overview

**Creative North Star: "O Console de Serviço Pastoral"**

A identidade visual combina acolhimento comunitário e clareza institucional. Verdes profundos sustentam a marca e dão contraste à navegação, enquanto o fundo off-white e as superfícies brancas mantêm conteúdo, formulários e informações pastorais legíveis. A Home pode ser mais expressiva, com fotografia, grandes títulos e chamadas em formato de pílula; a área administrativa reutiliza o mesmo vocabulário com densidade menor e hierarquia operacional.

No painel, tarefa e estado aparecem antes da decoração. Títulos descrevem a ação corrente, dados reais ganham destaque apenas quando orientam uma decisão e o restante da interface se organiza em planos de trabalho contínuos. Bordas discretas, cantos consistentes, ícones Lucide de traço leve e sombras tingidas de verde preservam a familiaridade da marca sem transformar `/adm` em um dashboard genérico.

**Key Characteristics:**

- Verdes institucionais como estrutura, ação e reconhecimento de marca.
- Fundo off-white com superfícies brancas separadas por bordas suaves.
- Manrope em pesos fortes para títulos e leitura direta no corpo.
- Cantos amplos e consistentes, com pílulas reservadas às chamadas públicas.
- Profundidade seletiva; a maior parte das superfícies permanece plana.
- Administração orientada por tarefa, estado e dado real.

## Colors

A paleta progride do verde pastoral profundo ao lima vivo, equilibrada por neutros levemente aquecidos e esverdeados.

### Primary

- **Verde Santuário Profundo** (`green-950`): ancora hero, rodapé, login e navegação administrativa; em superfícies extensas recebe texto branco e acentos luminosos.
- **Verde Estrutural** (`green-900`): diferencia painéis escuros de informação e o bloco administrativo que destaca a contagem de membros.
- **Verde Institucional** (`green-800`): ação primária e controles administrativos; muda para `green-700` no hover.
- **Verde de Orientação** (`green-700`): ícones, links, indicadores e estados interativos que precisam aparecer sem competir com o conteúdo.

### Secondary

- **Verde Comunidade** (`brand-green`): chamada pública, foco global e realce de palavras ou ícones ligados à marca.
- **Lima de Celebração** (`brand-lime`): acento raro sobre fundos escuros, usado em sobrancelhas, horários e pequenos destaques; não é a cor de preenchimento dominante do painel.

### Neutral

- **Papel Pastoral** (`background`): plano de fundo geral da Home e do espaço de trabalho administrativo.
- **Branco de Conteúdo** (`surface`): cartões, campos, item ativo da navegação e áreas de leitura.
- **Névoa Verde** (`surface-soft`): hover discreto, skeleton, cabeçalhos de tabela e blocos auxiliares.
- **Tinta Profunda** (`text-primary`): texto principal sobre fundos claros.
- **Tinta Suave** (`text-secondary`): descrições, metadados, instruções e valores secundários.
- **Divisor Botânico** (`border`): bordas de um pixel, divisores e contornos de campos.

### Named Rules

**The Dark Anchor Rule.** Áreas extensas em verde profundo servem para orientação, marca ou contexto de confiança; o plano principal de leitura permanece claro.

**The Rare Lime Rule.** O lima marca celebração e atenção em pequenas doses, principalmente sobre verde escuro; ele não substitui o verde institucional como ação administrativa.

## Typography

**Display Font:** Manrope (with ui-sans-serif, system-ui, sans-serif)  
**Body Font:** Manrope (with ui-sans-serif, system-ui, sans-serif)  
**Label Font:** Manrope (with ui-sans-serif, system-ui, sans-serif)

**Character:** Uma única família sustenta toda a experiência. O peso extrabold e o tracking negativo dão presença contemporânea aos títulos; corpo e metadados ficam neutros, diretos e legíveis.

### Hierarchy

- **Display** (800, escala fluida do token `display`, entrelinha 1.02): reservado ao hero público e a afirmações de marca de primeira ordem.
- **Headline** (800, escala fluida do token `headline`, entrelinha 1.06): títulos de seções públicas.
- **Title** (800, `title`, tracking negativo): título de página administrativa; passa de 1.875rem para 2.25rem a partir de 640px.
- **Body** (400, `body`): texto corrente. Descrições administrativas usam entrelinha de 1.5rem a 1.75rem e largura de leitura entre 46ch e 68ch quando delimitada.
- **Label** (700, `label`): rótulos de campos, botões e navegação operacional; pesos 600 e 800 aparecem apenas para metadados secundários e ênfase adicional.
- **Eyebrow** (700, `eyebrow`, caixa alta): identifica seções públicas. Tabelas e resumos administrativos usam uma variação mais contida, com tracking de 0.1em a 0.12em.

### Named Rules

**The One Family Rule.** Manrope sustenta marca e operação; contraste vem de peso, escala, tracking e cor, não de uma segunda família tipográfica.

**The Tight Title Rule.** Títulos grandes usam peso 800 e tracking negativo; texto de apoio retorna ao espaçamento normal para não sacrificar leitura.

## Layout

A Home usa contêiner central de até 1360px, com respiros laterais de 20px no mobile, 32px a partir de 640px e 48px a partir de 1024px. As seções alternam composições editoriais e grids, mas mantêm a escala base de 4px e intervalos recorrentes de 8, 12, 16, 20, 24, 32, 48 e 64px.

O painel adota um shell operacional. A partir de 1024px, uma sidebar sticky de 272px ocupa toda a altura e permanece visível enquanto o documento rola. O conteúdo administrativo é centralizado em até 1152px, com padding lateral progressivo de 20, 32, 48 e 64px. O cabeçalho interno tem 64px de altura e permanece fixo no topo.

No mobile, a sidebar vira uma gaveta lateral de até 336px ou 88vw, aberta por um controle de 44px. Formulários passam de uma para duas colunas a partir de 640px. A listagem de membros usa tabela a partir de 768px e registros verticais abaixo desse ponto, sem depender de rolagem horizontal. Login e navegação lateral só assumem composição dividida a partir de 1024px.

**The One Work Plane Rule.** Cada rota administrativa apresenta um cabeçalho contextual e um único plano principal de trabalho; subdivisões existem para agrupar conteúdo, não para simular um mosaico de widgets.

## Elevation & Depth

O sistema é plano por padrão. Fundo, borda e mudança tonal estabelecem a maior parte da hierarquia; sombras aparecem apenas em elementos que precisam flutuar, destacar um dado ou permanecer disponíveis durante a rolagem. Quando existem, são amplas, suaves e tingidas de verde escuro, nunca pretas e duras.

### Shadow Vocabulary

- **Agrupamento editorial** (`0 30px 60px -40px rgba(2, 44, 30, 0.55)`): lista de princípios que faz a transição entre hero e conteúdo.
- **Dado administrativo em destaque** (`0 16px 40px -24px rgba(2, 44, 30, 0.55)`): bloco de contagem real na visão geral.
- **Ação de autenticação** (`0 10px 24px rgba(2, 82, 56, 0.2)`): botão primário do login; no hover passa a `0 14px 30px rgba(2, 82, 56, 0.24)` e sobe 2px.
- **Barra de ação persistente** (`0 14px 40px -24px rgba(2, 44, 30, 0.45)`): rodapé sticky do formulário administrativo.
- **Gaveta lateral** (`18px 0 50px rgba(2, 44, 30, 0.25)`): separa a navegação móvel do conteúdo coberto.
- **Modal de membro** (`0 24px 80px rgba(2, 44, 30, 0.28)`): maior nível de sobreposição da experiência pública.

### Named Rules

**The Flat-by-Default Rule.** Cartões e fieldsets comuns usam borda e contraste de superfície, sem sombra; elevação fica reservada a transição, sobreposição e persistência.

## Shapes

A forma base nasce de um raio de 12px e se desdobra em 8, 10, 12, 16, 20 e 24px. Controles administrativos usam principalmente cantos de 16px; contêineres administrativos, 20px; cartões públicos mais expressivos, 24px. Botões de chamada da Home e ações sociais usam silhueta de pílula ou círculo. Bordas são finas, contínuas e de baixo contraste.

Ícones vêm de Lucide, normalmente entre 16 e 24px, com `strokeWidth` de 1.5 a 1.8 para manter leveza. Blocos de ícone usam o mesmo vocabulário de cantos dos controles e superfícies que os contêm.

**The Radius Hierarchy Rule.** O raio cresce com a escala e a expressividade do elemento: controles antes de contêineres, contêineres antes de cartões editoriais; pílulas não migram para a densidade operacional do painel.

## Components

### Buttons

Chamadas públicas são amplas e acolhedoras; controles administrativos são compactos e diretos.

- **Public Primary:** pílula em `brand-green`, texto `green-950`, padding de 16px por 28px e peso 700; no hover sobe 2px e muda para `brand-lime`.
- **Admin Primary:** cantos de 16px, fundo `green-800`, texto branco, peso 700 e altura de 44px; o login usa 48px e peso 800. O hover muda para `green-700`.
- **Admin Secondary:** fundo branco ou transparente, borda `border`, texto `green-900` e hover em `surface-soft`.
- **Focus:** outline global de 2px em `brand-green`, afastado 3px; componentes Radix também preservam anel de foco.
- **Disabled:** mantém o rótulo, bloqueia repetição de ação e reduz opacidade entre 0.55 e 0.65; botões elevados removem a sombra.

### Cards / Containers

Superfícies claras organizam conteúdo sem competir com ele.

- **Public Cards:** cantos de 24px, fundo `surface`, borda `border` quando necessário e padding geralmente de 28 a 32px.
- **Admin Containers:** cantos de 20px, fundo branco, borda `border` e padding de 24px no mobile e 32px a partir de 640px.
- **Admin Highlight:** o total de membros usa fundo `green-900`, texto branco e um único acento `brand-lime`; não cria uma grade de métricas.
- **Skeletons:** blocos em `surface-soft`, com os mesmos raios da estrutura que substituem e pulso de carregamento.

### Inputs / Fields

Campos administrativos são espaçosos, claros e previsíveis.

- **Style:** altura de 48px, cantos de 16px, fundo branco, borda `border` e padding horizontal de 12px. Inputs mantêm 1rem no mobile e 0.875rem a partir de 768px.
- **Textarea:** segue o mesmo contorno, tem altura mínima de 96px no formulário do site e permite redimensionamento vertical.
- **Focus:** usa o foco verde compartilhado; o caret administrativo usa `green-700`.
- **Error:** borda e anel mudam para o vermelho de erro já usado pela implementação; a mensagem aparece abaixo do campo, nunca apenas por cor.
- **Hint:** texto de 0.75rem e entrelinha de 20px em `text-secondary`, sempre entre rótulo e campo.

### Navigation

A Home usa cabeçalho fixo sobre o hero, links brancos com sublinhado verde animado e menu móvel em plano verde profundo. O painel mantém os mesmos verdes em uma navegação própria: sidebar `green-950`, itens de 44px, cantos de 16px e ícones Lucide; o item ativo inverte para fundo branco e texto `green-950`. No mobile, um cabeçalho sticky de 64px abre a gaveta equivalente. “Voltar ao site” e “Sair” permanecem no rodapé da navegação.

### Member Records

A listagem administrativa prioriza varredura e integridade dos dados. No desktop, cabeçalho em `surface-soft`, divisores de um pixel, linhas com padding de 24px por 16px e hover tonal discreto. No mobile, cada linha vira um registro vertical com ícone, nome, data, telefone e e-mail; números e datas usam algarismos tabulares.

### Operational States

Login, verificação, acesso negado, carregamento, vazio, erro e sucesso são composições explícitas. Spinners usam verde, skeletons usam `surface-soft`, erros usam vermelho e sucessos usam `green-800`. Mensagens ficam junto da tarefa correspondente e preservam uma próxima ação visível, como tentar novamente ou retornar ao site.

## Do's and Don'ts

### Do:

- **Do** reutilize os tokens semânticos de `src/styles.css` para verdes, superfícies, texto, borda e foco.
- **Do** mantenha Manrope e a hierarquia de peso 800 para títulos, 700 para ações e rótulos e 400 a 600 para leitura e metadados.
- **Do** mantenha alvos interativos administrativos com pelo menos 44px e foco visível.
- **Do** adapte tabelas para registros verticais no mobile quando a informação não couber com legibilidade.
- **Do** use estados de loading, vazio, erro, sucesso e disabled dentro da composição da tarefa.
- **Do** respeite `prefers-reduced-motion`; a implementação reduz animações e transições globalmente.

### Don't:

- **Don't** introduza gráficos, métricas sem fonte, gradientes decorativos ou grades repetitivas de cartões no painel.
- **Don't** transforme `brand-lime` em grande superfície administrativa; preserve-o como acento raro.
- **Don't** substitua bordas e contraste tonal por sombras em todos os cartões.
- **Don't** use pílulas como forma padrão para campos, navegação ou ações densas do painel.
- **Don't** oculte o foco do teclado nem dependa de rolagem horizontal para a listagem móvel.
- **Don't** promova a composição específica de `/adm` a regra para páginas públicas; compartilhe tokens e linguagem, não a arquitetura da rota.
