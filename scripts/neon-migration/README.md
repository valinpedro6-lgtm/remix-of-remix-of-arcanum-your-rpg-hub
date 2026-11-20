# Importação isolada do backup Arcanum para Neon

Este utilitário valida o backup privado definido no código em `/home/ubuntu/.private-backups/arcanum-supabase` e, por padrão, executa somente um dry-run local. Ele não lê valores de registros para a saída: os logs se limitam a nomes de arquivos/tabelas, contagens e hashes. O dry-run não abre conexão de rede.

## Requisitos

- Node.js 20 ou superior.
- Dependências locais instaladas com `npm install` neste diretório.
- Para importar: uma URL de conexão Postgres/Neon fornecida explicitamente por `NEON_DATABASE_URL` e a confirmação `NEON_TARGET_LABEL=arcanum-test`.

## Uso

```sh
cd scripts/neon-migration
npm install
npm run dry-run
```

A validação confere o manifesto, número de arquivos, tamanhos em bytes, SHA-256, cabeçalhos e contagens de registros de todos os CSVs. Também confirma que as três colunas JSON do CSV privado contêm arrays com 46 tentativas, 1 configuração de acesso e 70 sessões, sem imprimir os valores.

A carga é explicitamente opt-in:

```sh
NEON_TARGET_LABEL=arcanum-test NEON_DATABASE_URL='postgresql://…' npm run apply
```

`--apply` é recusado se qualquer uma das duas variáveis não atender aos requisitos. Antes de carregar, a transação cria (ou confirma) o schema e aborta se qualquer uma das sete tabelas de destino contiver linhas. A carga inteira — schema, `COPY` em streaming, expansão JSON, verificações das contagens e SQL pós-carga — usa uma única transação; qualquer erro provoca rollback. Históricos passam por tabelas temporárias para preservar `history_id` identity, e os históricos automáticos só são ativados após a importação. A instalação do schema não inclui seed de acesso nem cria policies RLS permissivas.

A confirmação de destino é uma barreira contra acidentes, não uma validação de identidade do servidor: antes de executar `--apply`, confira o destino da URL de conexão fora dos logs. O programa não imprime a URL, credenciais, dados de linhas nem texto bruto de erros do driver. Mantenha o backup e a URL protegidos.

## Arquivos

- `schema.sql`: as tabelas `sheets`, `tabletops`, `sheets_history`, `tabletops_history`, `access_gate`, `access_attempts` e `access_sessions`, com constraints/índices relevantes, campos recentes de combate/câmera e `age TEXT`.
- `post-load.sql`: triggers de histórico e `updated_at`, além da sincronização das sequences identity.
- `import-backup.mjs`: validação de manifesto/CSV e importação transacional opcional.
