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
- Estilos com Tailwind CSS
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

| Script                 | Descrição                             |
| ---------------------- | ------------------------------------- |
| `npm run dev`          | Inicia em modo de desenvolvimento     |
| `npm run build`        | Gera a versão de produção em `dist/`  |
| `npm run preview`      | Serve localmente a versão de produção |
| `npm run typecheck`    | Verifica os tipos                     |
| `npm run lint`         | Analisa o código                      |
| `npm run lint:fix`     | Corrige o que o lint resolve sozinho  |
| `npm run format`       | Formata o código com Prettier         |
| `npm run format:check` | Confere a formatação                  |
| `npm test`             | Roda os testes                        |
| `npm run test:watch`   | Roda os testes a cada alteração       |

## Estrutura

```text
src/
  app/        Componente raiz
  config/     Variáveis de ambiente validadas e CSP do build
  styles/     CSS global
  test/       Configuração dos testes
```

As pastas `features`, `components`, `hooks`, `lib` e `constants` entram conforme as funcionalidades são criadas, cada uma com o alias correspondente (`@features`, `@components`, `@hooks`, `@lib`, `@constants`).

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
