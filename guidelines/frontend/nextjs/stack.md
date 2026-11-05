# Stack — Frontend Next.js

> Extraída de `systems/transacional-ibanking-web` (Internet Banking transacional).
> Design system (tokens, componentes, mecânica visual): [`design-system.md`](design-system.md)
> + [`design-tokens.json`](../_shared/design-tokens.json) + [`components/`](components/). Método de design
> agnóstico: [`../_shared/design-principles.md`](../_shared/design-principles.md).
>
> **As versões desta página são o mínimo de referência.** Subir de versão para corrigir
> vulnerabilidade é sempre permitido, e obrigatório quando a correção existe
> ([`_shared/vulnerable-and-proprietary-libs.md`](../../_shared/vulnerable-and-proprietary-libs.md) §1).

## Runtime e linguagem

| Item | Versão | Observação |
|---|---|---|
| Node.js | 26.x | `.nvmrc` = `24`, `engines` e imagem base e de build na mesma versão principal; `preinstall` falha se não for 24.x |
| TypeScript | 6.x | `strict: true` + `exactOptionalPropertyTypes`, `noImplicitOverride`, `noImplicitReturns`, `noUnusedLocals/Parameters`, `noFallthroughCasesInSwitch`, `useUnknownInCatchVariables` |
| React | 19.x | Server Components habilitados (`rsc: true`) |
| Next.js | 16.x | App Router; Turbopack; `poweredByHeader: false`; sem source maps em produção |

Path alias único: `@/* → ./src/*`.

## Framework e UI

| Biblioteca | Uso |
|---|---|
| `next` (App Router) | Rotas, route handlers (BFF), layouts, RSC |
| `react` / `react-dom` 19 | UI |
| Tailwind CSS 3.4 + `tailwindcss-animate` | Estilização utilitária; `class-variance-authority`, `clsx`, `tailwind-merge` |
| Radix UI (`@radix-ui/react-*`) | Primitivos acessíveis |
| shadcn/ui (`components.json`, style `new-york`, baseColor `zinc`) | Componentes em `src/components/ui` |
| `@phosphor-icons/react`, `@radix-ui/react-icons` | Ícones |
| `lottie-react`, `sonner`, `vaul`, `cmdk`, `input-otp`, `react-day-picker` | Componentes especializados |

## Estado e dados

| Biblioteca | Uso |
|---|---|
| `@reduxjs/toolkit` + `react-redux` + `redux-persist` | Estado global do cliente (sessão, seleção de conta) |
| `@tanstack/react-query` (+ devtools) | Estado de servidor: fetch, cache, mutations |
| `@tanstack/react-table` | Tabelas de dados (extratos, transações) |
| `axios` | Cliente HTTP dos route handlers para o `API_GATEWAY_URL` |
| `react-hook-form` + `@hookform/resolvers` + `zod` 4 | Formulários e validação de schema |
| `dayjs` | Datas |

## Segurança (libs)

| Biblioteca | Uso |
|---|---|
| `jose` | Assinatura/verificação e parsing de JWT no servidor |
| `dompurify` | Sanitização de HTML |
| `imask` / `react-imask` | Máscaras de input |

Chaves públicas RSA, `SECRET_KEY` de sessão e `API_USER_KEY` vêm de env (ver `.env.example`);
nunca commitadas. Ver [`security.md`](security.md).

## Qualidade e build

| Ferramenta | Uso |
|---|---|
| ESLint 9 (flat, `eslint.config.mjs`) | `js.recommended` + `react.flat.recommended` + `next/core-web-vitals` + `typescript-eslint.recommended` + `prettier`; `import-helpers/order-imports` |
| Prettier 3 | `singleQuote`, `semi`, `trailingComma: all`, `tabWidth: 2`, `endOfLine: lf` |
| `typescript-eslint` com `projectService` | Regras type-aware |
| Jest 30 + `jest-environment-jsdom` + Testing Library (`react`, `jest-dom`) | Testes de unidade/componente (`next/jest`) |
| Storybook 10 (`@storybook/nextjs`, addon-a11y, addon-themes) | Catálogo de componentes + verificação de acessibilidade |
| Playwright 1.64 + `@axe-core/playwright` | E2E contra o artefato e varredura de acessibilidade ([`testing.md`](testing.md) §7) |
| `knip` | Detecção de código/dep morto |
| Husky + `lint-staged` + `@commitlint/config-conventional` | Hooks de commit (Conventional Commits — ver `_shared/git-workflow.md`) |
| SonarQube | `sonarqube.apps.ioc.bcloud.sfb` — projeto `wib.transacional-ibanking-web.*` |

## Infra

> **Esteira: `APP_TYPE=nodejs`.** A aplicação Next.js é o próprio BFF (route handlers) e é publicada
> como `nodejs` (`Jenkinsfile-Build-nodejs` + `openshiftBuildImage`, build S2I de `src/`;
> [`../_shared/spa-bff.md`](../_shared/spa-bff.md) §2.1 e §7,
> [`_shared/architecture-principles.md`](../../_shared/architecture-principles.md) §10). As regras de
> build abaixo partem da premissa de que o S2I roda `npm run build` e depois `npm start`, **a
> confirmar no primeiro deploy de teste**.

- **Deploy:** OpenShift (`apps.ioc.*.bcloud.sfb`), via `APP_TYPE=nodejs`;
  `configuration/configmap/<app>.yml` + `configuration/secret/<app>.yml`, só de desenvolvimento,
  entregues por `envFrom` (*a confirmar para o template `nodejs`*,
  [`operations-and-readiness.md`](../../_shared/operations-and-readiness.md) §2.2); homologação e
  produção são configurados fora do repositório, e o `Secret` de dev segue a exceção de
  [`operations-and-readiness.md`](../../_shared/operations-and-readiness.md) §2.2 e §5.
- **Build e execução:** `build` = `next build` (roda dentro da imagem); `start` = `next start`.
  **Sem `output: 'standalone'`** nesse caminho: o S2I já mantém `node_modules`, e o standalone
  exigiria copiar `.next/static` e `public/` à mão. `next`, `react` e `react-dom` (e o que o servidor
  usa em execução) ficam em `dependencies`; o resto em `devDependencies`, removidas depois do build.
  `next.config` em `.js`/`.mjs`, para não depender do TypeScript em execução.
- **Sem lockfile na imagem:** o Exportar apaga o `package-lock.json` e o S2I reinstala a partir do
  `package.json`: **toda** dependência com versão exata (sem `^`/`~`). O lockfile continua valendo
  para CI, SCA e dev local.
- **`NEXT_PUBLIC_*` não carrega valor por ambiente.** O Next grava essas variáveis no bundle durante
  o `next build`, e o build do S2I roda sem o `ConfigMap`: o valor sairia vazio e igual em todo
  ambiente. Valor por ambiente é lido no servidor em execução (`process.env` num Server Component ou
  route handler) e entregue ao cliente.
- **Testes:** `RUN_UNIT_TESTS=true` no cadastro; configuração do Jest no arquivo de nome literal
  `jest.config.js` (o `next/jest` funciona nele) contendo `jest-junit`; script `"test:coverage":
  "jest --coverage"`. Lint e typecheck no repositório (a esteira não os roda).
- **Escuta do processo:** `PORT` e `HOSTNAME` são definidos **num único lugar, documentado** (o
  `ConfigMap`), iguais em qualquer forma de build (`HOSTNAME=0.0.0.0`; o sistema de referência usa
  `PORT=8080`). A plataforma injeta `HOSTNAME` com o nome do pod, e o servidor passa a escutar só
  nesse nome: a sonda falha mesmo com a aplicação de pé.
- **Artefato:** `npm run build` produz o necessário para `npm start` **sem passos externos**.
  Scripts de `package.json` portáveis entre sistemas operacionais (SHOULD): sem `cp -r`, `rm -rf` nem
  variável de ambiente em sintaxe POSIX.
- **Observabilidade:** AppDynamics e Google Analytics (`@next/third-parties`), com o ID lido no
  servidor em execução (não em `NEXT_PUBLIC_*`, ver acima).
- **Segurança de sessão do dispositivo:** Topaz / Warsaw (OFDB), com o ID de sessão lido no servidor
  em execução pelo mesmo motivo.
- Certificado corporativo: `NODE_EXTRA_CA_CERTS=./ca_banestes.pem`, **em execução** (não só no
  build), relativo ao diretório de execução; inclui a CA do roteador interno quando o servidor chama
  a API por Route. Preferir o Service interno. Proibido `NODE_TLS_REJECT_UNAUTHORIZED=0`.
- **Registro npm:** instalação via o espelho corporativo (Nexus), nunca o registro público direto —
  ver [`_shared/vulnerable-and-proprietary-libs.md`](../../_shared/vulnerable-and-proprietary-libs.md) §2.

## Versionamento

Versões fixas via `package-lock.json` commitado. Ver `_shared/vulnerable-and-proprietary-libs.md`
(política de CVE e `npm audit` no pipeline).
