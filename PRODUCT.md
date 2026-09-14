<!-- impeccable:product-schema 1 -->

# PIB Jussara — contexto de produto

## Produto

Site institucional da Primeira Igreja Batista de Jussara - GO, com uma área pública para visitantes e membros e uma área administrativa privada em `/adm`.

## Pessoas e contexto de uso

- Visitantes acessam a Home para conhecer a igreja, programação, transmissões e informações de contato.
- Membros usam a autenticação já existente, mas uma conta autenticada não recebe acesso administrativo automaticamente.
- Administradores autorizados usam `/adm` para consultar membros cadastrados e manter informações institucionais exibidas no site.
- O painel deve funcionar em computador e celular, com navegação lateral no desktop e menu adaptado no mobile.

## Tarefas essenciais

- Entrar e sair com segurança usando o Supabase Auth existente.
- Distinguir, no banco, contas comuns de contas administrativas.
- Ver a quantidade real de membros e consultar a lista de membros com busca.
- Editar telefone, e-mail institucional, endereço completo e links sociais/transmissão.
- Refletir as informações persistidas na Home sem depender de valores duplicados no código.

## Conteúdo institucional confirmado

- Igreja: Primeira Igreja Batista de Jussara.
- Nome curto: PIB Jussara.
- Cidade: Jussara - GO.
- Idioma principal: português do Brasil.
- Identidade visual existente: verdes institucionais, superfícies claras, logotipo e tipografia já usados no site.

## Regras de acesso e segurança

- Cadastro público cria somente membro comum por padrão.
- A função administrativa é controlada no banco e não pode ser promovida pelo frontend.
- Não há e-mail ou UUID de administrador codificado no projeto.
- A tabela `auth.users` não é consultada diretamente pelo navegador.
- A Service Role nunca é exposta ao frontend.
- Informações públicas do site podem ser lidas sem autenticação; somente administradores podem alterá-las.
- Nenhum dado administrativo é exibido antes da confirmação de sessão e autorização.

## Limites desta versão

- Sem exclusão de membros, gestão de senhas, edição de funções, CMS genérico, métricas fictícias ou novos módulos administrativos.
- A promoção inicial de administrador é um procedimento controlado e manual, documentado separadamente.
- Migrações são incrementais e preservam usuários, perfis e histórico existente.
- Código, migração e validações podem ser preparados localmente; publicação no GitHub/Lovable e aplicação no banco real exigem autorização explícita.
