# Saúde+ Web

[![CI](https://github.com/Plovatto/SaudeMais/actions/workflows/ci.yml/badge.svg)](https://github.com/Plovatto/SaudeMais/actions/workflows/ci.yml)
[![Pages](https://github.com/Plovatto/SaudeMais/actions/workflows/pages.yml/badge.svg)](https://github.com/Plovatto/SaudeMais/actions/workflows/pages.yml)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/Plovatto/SaudeMais/badge)](https://scorecard.dev/viewer/?uri=github.com/Plovatto/SaudeMais)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-22%20%7C%2024%20%7C%2026-339933?logo=node.js&logoColor=white)](https://nodejs.org/)

Interface do Saúde+, aplicação de agendamento de consultas e exames com três perfis: paciente, médico e administrador. Desenvolvida com React, TypeScript e Vite.

> Projeto em desenvolvimento. O andamento está no [quadro do projeto](https://github.com/users/Plovatto/projects/2).

**Site:** https://plovatto.github.io/SaudeMais/

**API:** https://p01--saudemais--pgj2h2jjxzb4.code.run/docs/ · [Plovatto/API-SaudeMais](https://github.com/Plovatto/API-SaudeMais)

## Funcionalidades

- SPA criada com React e Vite, organizada por domínios da aplicação
- Estilos com Tailwind CSS, tokens de design e tema claro e escuro
- Rotas por perfil carregadas sob demanda, com navegação inferior no celular e menu lateral a partir de 1024 px
- Componentes base acessíveis (teclado, foco visível, alvos de toque de 44 px), fiéis ao Figma
- Endereço da API validado no build: sem `VITE_API_URL` válida, o build falha em vez de publicar uma página em branco
- Alias de importação configurados no Vite
- Testes automatizados com Vitest e Testing Library

## Tecnologias

- [React](https://react.dev/) 19
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/)
- [Tailwind CSS](https://tailwindcss.com/) 4
- [Zod](https://zod.dev/) - validação de dados
- ESLint e Prettier - análise e padronização do código
- [Vitest](https://vitest.dev/) e [Testing Library](https://testing-library.com/) - testes automatizados

## Como Executar

### Pré-requisitos

- [Node.js](https://nodejs.org/) 22.22.2+, 24.15+ ou 26+
- npm
- A [API do Saúde+](https://github.com/Plovatto/API-SaudeMais) rodando localmente ou o endereço da API publicada

### Instalação

Clone o repositório:

```bash
git clone https://github.com/Plovatto/SaudeMais.git
```

Acesse a pasta do projeto:

```bash
cd SaudeMais
```

Instale as dependências:

```bash
npm install
```

Crie o arquivo de variáveis de ambiente:

```bash
cp .env.example .env
```

Execute em modo de desenvolvimento:

```bash
npm run dev
```

A aplicação estará disponível em:

```text
http://localhost:5173
```

## Variáveis de Ambiente

As variáveis são definidas no arquivo `.env`, que não deve ser versionado. Utilize `.env.example` como referência:

```env
VITE_API_URL=http://localhost:3001
```

`VITE_API_URL` é o endereço da API, com `http` ou `https`, sem query string. O build é recusado se ela faltar ou for inválida. Como toda variável `VITE_`, ela fica visível no código publicado; nunca coloque segredos nela.

## Scripts

| Script                 | Descrição                                 |
| ---------------------- | ----------------------------------------- |
| `npm run dev`          | Inicia em modo de desenvolvimento         |
| `npm run build`        | Gera a versão de produção em `dist/`      |
| `npm run preview`      | Serve localmente a versão de produção     |
| `npm run typecheck`    | Verifica os tipos                         |
| `npm run lint`         | Analisa o código                          |
| `npm run lint:fix`     | Corrige o que o lint resolve sozinho      |
| `npm run format`       | Formata o código com Prettier             |
| `npm run format:check` | Confere a formatação                      |
| `npm test`             | Roda os testes                            |
| `npm run test:watch`   | Roda os testes a cada alteração           |
| `npm run api:types`    | Gera os tipos a partir do contrato da API |
| `npm run e2e`          | Roda os testes ponta a ponta              |
| `npm run e2e:ui`       | Abre os testes ponta a ponta no modo UI   |

## Testes ponta a ponta

Os testes em `e2e/` usam [Playwright](https://playwright.dev/) e [axe](https://github.com/dequelabs/axe-core) e cobrem três fluxos: cadastro e agendamento; confirmação pelo médico e notificação ao paciente; o Admin torna um usuário médico e a vaga aparece para o paciente. Cada fluxo roda no Chromium e no WebKit, em 402 px e em 1280 px, e falha se o axe encontrar violação séria ou crítica.

Eles precisam da [API](https://github.com/Plovatto/API-SaudeMais) rodando em `http://localhost:3001` com um banco descartável, nunca o de produção. Na pasta da API, com o `.env` apontando para esse banco:

```env
NODE_ENV=development
CORS_ORIGIN=http://localhost:4173
APP_PUBLIC_URL=http://localhost:4173/SaudeMais
MAIL_DRIVER=console
DEMO_ACCOUNTS_ENABLED=true
ADMIN_EMAIL=admin@e2e.test
ADMIN_PASSWORD=uma-senha-de-teste-longa
```

```bash
npm run db:seed
npm run dev
```

Aqui, instale os navegadores uma vez e rode os testes com as mesmas credenciais do Admin:

```bash
npx playwright install chromium webkit
ADMIN_EMAIL=admin@e2e.test ADMIN_PASSWORD=uma-senha-de-teste-longa npm run e2e
```

O Playwright gera o build com `VITE_API_URL=http://localhost:3001` e o serve com `vite preview` em `http://localhost:4173/SaudeMais/`. A API limita cadastros a 10 por hora por IP e cada rodada cria 8 contas; reinicie a API para zerar os limites. No CI, o workflow `E2E` sobe a API da branch `main` contra um PostgreSQL 18 temporário e publica o relatório e os traces quando algo falha.

## Estrutura

```text
src/
  app/          Componente raiz e rotas
  components/
    layout/     Layouts, cabeçalho, navegação e menu da conta
    ui/         Componentes base de interface (botões, campos, diálogos, menus...)
  config/       Variáveis de ambiente validadas e CSP do build
  constants/    Áreas, páginas e navegação de cada perfil
  features/     Funcionalidades por domínio (erros, autenticação...)
  hooks/        Hooks compartilhados
  lib/          Utilitários (tema, classes CSS, navegação por teclado)
  styles/       CSS global e tokens de design
  test/         Configuração dos testes
```

Cada pasta tem um alias de importação (`@app`, `@components`, `@constants`, `@features`, `@hooks`, `@lib`, `@config`).

## Contribuindo

Veja o [guia de contribuição](CONTRIBUTING.md) e a [política de segurança](SECURITY.md).

## Publicação

Cada merge na `main` publica o site no GitHub Pages pelo workflow [Pages](.github/workflows/pages.yml). `VITE_API_URL` vem da variável de mesmo nome do repositório (Settings → Secrets and variables → Actions → Variables). Antes do build, o workflow roda lint e testes.

O build de produção:

- usa `/SaudeMais/` como caminho base (o `npm run preview` também);
- exige `VITE_API_URL` com `https`;
- copia `index.html` para `404.html`, para que links diretos para rotas internas abram a aplicação;
- injeta uma Content Security Policy que só permite scripts, estilos e fontes do próprio site e chamadas para a origem da API;
- impede que o site seja exibido dentro de outra página (`frame-ancestors` não funciona em meta tag, então o `theme-init.js` esconde a página quando ela é carregada dentro de um frame).

A API precisa aceitar a origem `https://plovatto.github.io` no CORS.

## Licença

Distribuído sob a licença MIT. Veja [LICENSE](LICENSE).
