# API Arcanum para Neon

Esta pasta contém uma API Cloudflare Worker que preserva os contratos atuais das funções `access-gate`, `user-data` e `shared-tabletop`, usando PostgreSQL/Neon por meio de um binding Hyperdrive. A aplicação continua apontando para o Supabase até que `VITE_API_BASE_URL` seja configurada explicitamente no ambiente publicado.

## Estado desta preparação

- O código foi portado para consultas parametrizadas no PostgreSQL.
- As respostas e caminhos antigos permanecem disponíveis enquanto a nova variável de ambiente não estiver definida.
- Não há connection string, chave HMAC, ID Hyperdrive ou segredo de produção neste repositório.
- O código não está implantado; não altere o ambiente Vercel nem pare o Supabase antes da importação e de testes completos no projeto Neon vazio.

## Configuração local

1. Instale as dependências dentro de `worker/` com `npm install`.
2. Copie `.dev.vars.example` para `.dev.vars` e informe localmente uma connection string de teste e um segredo HMAC de teste. Não compartilhe nem versione esse arquivo.
3. Inicie o Vite e o Worker localmente. Para testes locais, permita `http://localhost:5173` em `ALLOWED_ORIGINS`.
4. Use `npm run typecheck` antes de qualquer deploy.

## Preparação de produção (ainda não realizada)

1. Criar o binding Hyperdrive para a instância Neon já existente e adicionar o ID retornado à configuração do Wrangler. Use uma role PostgreSQL exclusiva da API e mantenha a senha no painel da Cloudflare, nunca no Git.
2. Definir `OWNER_HMAC_SECRET` como secret do Worker. Para que contas por e-mail e o acesso de mestre continuem apontando para os hashes `owner` já migrados, esse valor precisa ser **idêntico** ao antigo segredo usado pelo Supabase Edge Function. Não o gere de novo nem o envie por mensagem; se não for possível recuperá-lo, pare antes do corte e planeje uma migração de identidade antes de trocar o backend.
3. Restringir `ALLOWED_ORIGINS` ao domínio público do site e, se necessário, ao domínio de Preview usado para validação.
4. Configurar somente então `VITE_API_BASE_URL` no Vercel para a origem do Worker, opcionalmente terminada em `/functions/v1`, criar um deploy de preview e testar o fluxo de mestre, acesso por código, criação/edição de ficha, criação/edição de mesa e links compartilhados.
5. O corte para produção e a desativação do Supabase são passos separados e reversíveis; não devem ocorrer antes da comparação de contagens e da validação funcional.

A camada atual da mesa compartilhada faz polling a cada 2 segundos e cada chamada consulta a versão no banco. O nível gratuito tem cotas finitas; portanto, esta arquitetura não promete disponibilidade ilimitada nem deve ser cortada para produção sem acompanhar o tráfego real e verificar limites.
