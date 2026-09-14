# Promoção inicial de administrador

O cadastro público sempre cria uma conta com a função `member`. A primeira promoção para `admin` deve ser feita somente por uma pessoa com acesso administrativo ao banco, depois de confirmar a identidade e o UUID exato da conta existente.

1. Consulte a conta correta em `auth.users` pelo painel do Supabase.
2. Confirme o e-mail, a data de criação e o UUID com a pessoa responsável.
3. Execute a alteração abaixo no SQL Editor substituindo o marcador pelo UUID confirmado:

```sql
begin;

update public.profiles
set role = 'admin'
where id = '<UUID_CONFIRMADO>';

commit;
```

4. Confirme que exatamente uma linha foi alterada e teste `/adm` com essa conta.

Não use e-mail como regra permanente de autorização, não exponha a Service Role e não conceda `admin` por metadados enviados no cadastro.
