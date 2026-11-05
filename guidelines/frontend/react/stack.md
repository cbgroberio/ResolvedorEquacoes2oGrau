# Stack — Frontend React (SPA)

> SPA React com Vite, servida atrás de BFF ([`../_shared/spa-bff.md`](../_shared/spa-bff.md)).
> App que precisa de SSR, RSC ou SEO usa a coleção `frontend/nextjs`, não esta.
> Janela de versões: [`../_shared/version-policy.md`](../_shared/version-policy.md).
> Design system: [`design-system.md`](design-system.md) + tokens em
> [`../_shared/design-tokens.json`](../_shared/design-tokens.json).
> Versões conferidas no registro npm em 2026-10-02; Playwright reconferido em 2026-10-16
> (`npm view playwright version` → 1.64.1, a mesma do `package.json` do primeiro sistema).
> Jest e pares (`jest` 30.5.2, `@swc/jest` 0.2.39, `@swc/core` 1.16.18) conferidos no
> `package.json` do primeiro sistema.
>
> As tabelas listam bibliotecas **permitidas**, não obrigatórias: cada sistema usa o que
> precisa. Dependência exigida por `peerDependencies` de um item listado (ver "Pares exigidos
> por tooling") não é desvio.

## Runtime e linguagem

| Item | Recomendada | Aceita | Observação |
|---|---|---|---|
| Node.js | 24.x | 22.x | `.nvmrc` + `engines` |
| React / React DOM | 19.x | 18.3.x | 18.3 só em app existente em migração; React Router 8 exige React ≥ 19.2.7 |
| TypeScript | 6.0.x | — | Teto do `typescript-eslint` 8: `< 6.1` |
| Vite | 8.x | 7.x | `@vitejs/plugin-react` 6 exige Vite 8 |

`tsconfig`: `strict: true`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`,
`noImplicitOverride`, `noImplicitReturns`, `noFallthroughCasesInSwitch`,
`verbatimModuleSyntax`, `moduleResolution: "bundler"`. Path alias: `@/* → ./src/*`, só em
`paths` — o TypeScript 6 deprecia `baseUrl`, e `paths` funciona sem ele.

## Framework e UI

| Biblioteca | Uso |
|---|---|
| `react` / `react-dom` 19 | UI; `createRoot` + `StrictMode` |
| `@vitejs/plugin-react` 6 + `babel-plugin-react-compiler` 1.0 (+ `@rolldown/plugin-babel`, `@babel/core`) | Build; **React Compiler** ligado (memoização automática) — ver "React Compiler" abaixo |
| `react-router` 8 (data mode: `createBrowserRouter`) | Rotas, lazy, loaders, error boundary por rota. Framework mode não entra — SSR é `frontend/nextjs` |
| Tailwind CSS 4.x + `@tailwindcss/vite` | Estilização utilitária consumindo os tokens |
| Radix UI (`@radix-ui/react-*`) + shadcn/ui | Primitivos acessíveis; mesmos componentes do Next.js |
| `class-variance-authority` 0.7 + `clsx` + `tailwind-merge` 3 | Variantes e `cn()` |
| `@phosphor-icons/react` | Ícones |
| `sonner`, `vaul`, `cmdk`, `input-otp`, `react-day-picker` | Componentes especializados (mesmos do Next.js) |

## Estado e dados

| Biblioteca | Uso |
|---|---|
| `@tanstack/react-query` 5 (+ devtools em dev) | Estado de servidor: fetch, cache, mutations |
| `zustand` 5 | Estado global de cliente: UI e preferências (item selecionado, painel aberto, tema). **Não** guarda estado de servidor — a sessão (`GET /auth/session`) é query do React Query |
| `axios` 1.x | Cliente HTTP único para `/api/*` do BFF (`src/lib/http`) |
| `react-hook-form` 7 + `@hookform/resolvers` + `zod` 4 | Formulários e validação |
| `@tanstack/react-table` 9 (8.x aceita) | Tabelas de dados |
| `dayjs` 1.11 (locale `pt-br`) | Datas |
| `react-imask` | Máscaras de input |
| `react-error-boundary` | Fallback de erro de render fora das rotas |

Redux Toolkit não entra em app nova: estado de servidor (inclusive a sessão) é do React
Query e o restante cabe em Zustand.

Roteador: no navegador, `RouterProvider` vem de `react-router/dom` (React Router 8), não da
exportação da raiz; `createBrowserRouter`, `Link` etc. continuam em `react-router`.

## Segurança (libs)

| Biblioteca | Uso |
|---|---|
| `dompurify` 3 | Sanitização de HTML dinâmico |

Nenhuma lib OIDC no browser — ver [`security.md`](security.md).

## Qualidade e build

| Ferramenta | Uso |
|---|---|
| ESLint 9 (flat, `eslint.config.js`) + `typescript-eslint` 8 (`projectService`) | Regras TS type-aware. ESLint 10 aguarda `eslint-plugin-jsx-a11y` aceitar a major em `peerDependencies` |
| `eslint-plugin-react` + `eslint-plugin-react-hooks` 7 (inclui regras do React Compiler) + `eslint-plugin-jsx-a11y` + `eslint-plugin-react-refresh` | Regras React, hooks, compilador e acessibilidade |
| `no-restricted-imports` (regra nativa do ESLint) | Fronteiras entre camadas e features — config em [`architecture.md`](architecture.md) §3 |
| Prettier 3 + `prettier-plugin-tailwindcss` | `singleQuote`, `semi`, `trailingComma: all`, `tabWidth: 2`, `endOfLine: lf`; ordenação de classes |
| Jest 30 + `jest-environment-jsdom` + `@swc/jest` + Testing Library (`react` 16, `user-event`, `jest-dom` 7) | Testes de unidade, hook e componente. Jest é o **único** executor de testes: é o que o `Jenkinsfile-Build-nodejs` roda (com `RUN_UNIT_TESTS=true`, `jest.config.js` e `jest-junit`, ver [`../_shared/spa-bff.md`](../_shared/spa-bff.md) §7); receita para Vite em [`testing.md`](testing.md) §6 |
| MSW 3 | Mock de rede em teste, Storybook e dev |
| Playwright 1.64 + `@axe-core/playwright` | E2E e varredura de acessibilidade |
| Storybook 10 (`@storybook/react-vite`, addon-a11y, addon-themes) | Catálogo de componentes |
| `knip` | Código e dependência morta |
| Husky + `lint-staged` + `@commitlint/config-conventional` | Hooks de commit (ver [`_shared/git-workflow.md`](../../_shared/git-workflow.md)) |
| SonarQube | Regras em [`../_shared/sonar-frontend.md`](../_shared/sonar-frontend.md) |

`eslint-plugin-boundaries` não entra: a versão 7 puxa `handlebars` (CVE Critical) e `braces`
(High) sem correção, e a política de
[`_shared/vulnerable-and-proprietary-libs.md`](../../_shared/vulnerable-and-proprietary-libs.md)
bloqueia — o waiver não cobre Critical. As fronteiras usam `no-restricted-imports`.

O preset `strictTypeChecked` do `typescript-eslint` ativa `@typescript-eslint/no-deprecated`:
API marcada como deprecada (no primeiro sistema: `FormEvent`, `fetchQuery`) falha o lint —
trocar pela alternativa, não desligar a regra.

### React Compiler

Com `@vitejs/plugin-react` 6 o compilador não vem por opção do plugin: exige
`@rolldown/plugin-babel`, `@babel/core` e `babel-plugin-react-compiler`, ligados pelo preset
`reactCompilerPreset()`. Sem esse trecho o build passa, mas sem memoização automática.

```ts
// vite.config.ts (trecho)
import babel from '@rolldown/plugin-babel';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
});
```

### Pares exigidos por tooling

Dependência de desenvolvimento exigida por item da tabela acima; não precisa de justificativa
própria (continua sob a política de libs vulneráveis).

| Pacote | Exigido por |
|---|---|
| `@rolldown/plugin-babel` + `@babel/core` + `babel-plugin-react-compiler` | `@vitejs/plugin-react` 6 (React Compiler) |
| `jest` 30.5.2, `jest-environment-jsdom` 30.5.2, `@jest/globals` 30.5.2 | Executor, ambiente jsdom e globais importáveis (`@jest/globals`). O provider `v8` de cobertura já vem no Jest |
| `jest-junit` | Relatório `reports/junit.xml` exigido pelo `Jenkinsfile-Build-nodejs` ([`../_shared/spa-bff.md`](../_shared/spa-bff.md) §7) |
| `@swc/jest` 0.2.39 + `@swc/core` 1.16.18 | Transformador de TS/TSX e de pacotes só ESM (`msw`, `react-router`) — ver [`testing.md`](testing.md) §6 |
| `@eslint/js`, `globals` | Config flat do ESLint (`js.configs.recommended`, `globals.browser`/`globals.node`) |
| `@types/node`, `@types/react`, `@types/react-dom` | TypeScript (tipos de Node, React e React DOM) |
| `axe-core` | Verificação de a11y em teste de componente ([`testing.md`](testing.md) §3) — o `@axe-core/playwright` é só do e2e |
| `tw-animate-css` | Animações de Tailwind 4 usadas pelos primitivos shadcn/Radix (substitui `tailwindcss-animate`) |

### Contrato de scripts

Os scripts do `package.json` que a [DoD](definition-of-done.md) e o [`testing.md`](testing.md)
citam. O nome é fixo; o comando pode variar.

| Script | Faz |
|---|---|
| `npm run lint` | ESLint (inclui fronteiras, hooks, compilador e a11y) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run build` | `tsc --noEmit && vite build` |
| `npm test` | `jest` |
| `npm run test:coverage` | `jest --coverage` (relatório `lcov` em `coverage/lcov.info` para o SonarQube) |
| `npm run knip` | Código e dependência morta |
| `npm run test:e2e` | Playwright |

## Infra

- **Deploy:** a SPA é publicada **junto com o BFF** numa aplicação `APP_TYPE=nodejs`, e o BFF serve
  os estáticos ([`../_shared/spa-bff.md`](../_shared/spa-bff.md) §2.1). O tipo `react` da esteira
  (estáticos em Apache httpd) não serve SPA autenticada.
  Configuração por ambiente via `config.json`, servido pelo BFF a partir de variável do `ConfigMap` — ver [`../_shared/spa-bff.md`](../_shared/spa-bff.md) §4.
  `ConfigMap` e `Secret` do BFF em `configuration/configmap/<app>.yml` e `configuration/secret/<app>.yml`, só de desenvolvimento
  ([`_shared/operations-and-readiness.md`](../../_shared/operations-and-readiness.md) §2.2).
- **Observabilidade:** AppDynamics Browser RUM; ID vem do `config.json`.
- Certificado corporativo no build: `NODE_EXTRA_CA_CERTS=./ca_banestes.pem`.
- **Registro npm:** instalação via o espelho corporativo (Nexus), nunca o registro público direto —
  ver [`_shared/vulnerable-and-proprietary-libs.md`](../../_shared/vulnerable-and-proprietary-libs.md) §2.
- **Diretório de saída do build.** O BFF serve o diretório de saída do Vite, declarado num único
  lugar e lido pelo BFF. Só um **site estático sem autenticação** publicado como `react` precisa de
  `build: { outDir: 'build' }`, porque o Exportar do `Jenkinsfile-Build-httpd` empacota `build/` fixo.
- **Esteira:** Jenkins/OCP4, `Jenkinsfile-Build-nodejs` (ver
  [`_shared/architecture-principles.md`](../../_shared/architecture-principles.md), "Tipos de
  aplicação da esteira", e [`_shared/operations-and-readiness.md`](../../_shared/operations-and-readiness.md) §2.1).

## Versionamento

Versões fixas via `package-lock.json` commitado; atualização conforme
[`../_shared/version-policy.md`](../_shared/version-policy.md) e
[`_shared/vulnerable-and-proprietary-libs.md`](../../_shared/vulnerable-and-proprietary-libs.md).
