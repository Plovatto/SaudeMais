# Como contribuir

## Reportando problemas

Abra uma [issue](https://github.com/Plovatto/SaudeMais/issues) descrevendo o problema, os passos para reproduzir e o comportamento esperado. Falhas de segurança devem ser reportadas pela [política de segurança](SECURITY.md).

## Organização

O trabalho é planejado no [quadro do projeto](https://github.com/users/Plovatto/projects/2). Cada tarefa é uma issue ligada ao milestone da sua fase, e cada issue corresponde a uma branch e a um pull request.

## Enviando alterações

1. Crie uma branch a partir da `main` atualizada, com o prefixo do tipo da alteração: `feature/`, `fix/`, `chore/`, `docs/`, `test/`, `refactor/`, `perf/` ou `ci/`. Exemplo: `feature/book-appointment`.
2. Use commits no padrão [gitmoji](https://gitmoji.dev/) com [Conventional Commits](https://www.conventionalcommits.org/), em inglês e minúsculas, por exemplo `:bug: fix: keep the booking form filled when the slot is taken`.
3. Funcionalidades novas e correções devem vir acompanhadas de testes.
4. Antes de abrir o pull request, rode `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test` e `npm run build`.
5. Abra o pull request para a `main` seguindo o modelo (o que foi feito, detalhes e testes) e ligue a issue com `Closes #n`.
6. O merge é feito com merge commit, depois que o CI passar.

## Contrato com a API

O front usa uma cópia versionada do contrato da API em `src/lib/api/openapi.json`, e os tipos de `src/lib/api/schema.d.ts` são gerados a partir dela com `npm run api:types`. Quando a API mudar, atualize a cópia (a partir de `/docs/openapi.json` da API publicada) e gere os tipos no mesmo PR que usa a mudança. O CI falha se os tipos não corresponderem à cópia.

## Atualizações de dependências

Os pull requests do Dependabot (`dependabot/...`) são a exceção às regras de nome de branch e de issue vinculada: entram depois que o CI passar.

## Testes ponta a ponta

Os testes em `e2e/` cobrem três fluxos no Chromium e no WebKit, em 402 px e 1280 px, e falham se o axe encontrar violação séria ou crítica. Eles precisam da [API](https://github.com/Plovatto/API-SaudeMais) em `http://localhost:3001` com um banco descartável, nunca o de produção. Na pasta da API, com o `.env` criado a partir do `.env.example` e apontando para esse banco:

```env
NODE_ENV=development
CORS_ORIGIN=http://localhost:4173
APP_PUBLIC_URL=http://localhost:4173
MAIL_DRIVER=console
DEMO_ACCOUNTS_ENABLED=true
ADMIN_EMAIL=admin@e2e.test
ADMIN_PASSWORD=uma-senha-de-teste-longa
```

```bash
npm run db:seed
npm run dev
```

Na pasta do front, instale os navegadores uma vez e rode os testes com as mesmas credenciais do administrador:

```bash
npx playwright install chromium webkit
ADMIN_EMAIL=admin@e2e.test ADMIN_PASSWORD=uma-senha-de-teste-longa npm run e2e
```

Cada rodada cria 8 contas e faz cerca de 14 logins. Se os limites por IP da API forem atingidos, reinicie a API, que guarda os limites em memória.
