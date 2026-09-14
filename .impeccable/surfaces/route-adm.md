---
version: 1
slug: "route-adm"
primary_target: "route:/adm"
related_targets: ["route:/adm/site", "route:/adm/membros"]
---

# Direção da superfície administrativa

## THESIS

Um console de serviço pastoral em que a tarefa e o estado aparecem antes da decoração. A superfície evita o arranjo genérico de dashboard com widgets, gráficos e métricas sem fonte.

## OWN-WORLD

Verde institucional profundo na navegação, off-white no plano de trabalho, Manrope, superfícies brancas, bordas discretas, cantos consistentes e ícones Lucide. A marca da PIB Jussara permanece reconhecível mesmo sem conteúdo.

## STORY

O responsável confirma que está em uma área protegida, entende rapidamente o que pode administrar e executa três tarefas: acompanhar cadastros, consultar membros e manter as informações públicas da igreja.

## FIRST VIEWPORT

No desktop, sidebar fixa à esquerda e cabeçalho interno acima de “Visão geral”; o total real de membros domina a primeira área útil e o resumo institucional vem em seguida. No mobile, barra superior com menu de 44px, título e os mesmos blocos em uma coluna.

## FORM

Modo `Operate`, como extensão funcional do mundo visual já aprovado na Home. Seed key: indisponível na execução degradada do concept seed por restrição de rede; a direção foi fixada por este brief antes da implementação.

## Estrutura

Console de serviço pastoral com uma barra lateral verde-escura no desktop e gaveta equivalente no mobile. A navegação mantém três destinos claros — visão geral, informações do site e membros — enquanto a área principal usa um cabeçalho contextual e um único plano de trabalho por rota. “Voltar ao site” e “Sair” permanecem agrupados no rodapé da navegação.

## Hierarquia

A prioridade é operacional: primeiro o nome da tarefa e seu estado, depois o dado ou formulário necessário. A visão geral apresenta apenas a contagem real de membros e um resumo factual das informações públicas. Membros usam uma listagem legível com busca e total. Informações do site usam um formulário contínuo, agrupado por contato, localização e canais digitais, com a ação de salvar visível sem dominar a página.

## Linguagem visual

Herdar integralmente o mundo visual da Home: verdes institucionais, superfícies claras, Manrope, bordas discretas e cantos já existentes. A interface deve se parecer com uma extensão administrativa da PIB Jussara, não com um painel genérico. Ícones Lucide reforçam navegação e estado; não existem gráficos, números inventados, gradientes decorativos ou cartões repetitivos.

## Estados e confiança

Sessão e autorização são verificadas antes de qualquer conteúdo privado. Login, acesso negado, carregamento, vazio, erro e sucesso têm composição própria e texto que explica a próxima ação. Formulários preservam os dados visíveis, bloqueiam envio duplicado e confirmam o valor persistido sem `alert` do navegador.

## Responsividade

No desktop, a barra lateral permanece estável e a área de conteúdo pode rolar. No mobile, uma barra superior abre a navegação em gaveta; tabelas viram uma lista vertical de registros, sem rolagem horizontal. Alvos de toque têm no mínimo 44px e o foco do teclado continua visível.
