# Stack — Frontend Angular

> SPA Angular servida atrás de BFF ([`../_shared/spa-bff.md`](../_shared/spa-bff.md)).
> Janela de versões: [`../_shared/version-policy.md`](../_shared/version-policy.md).
> Design system: [`design-system.md`](design-system.md) + tokens em
> [`../_shared/design-tokens.json`](../_shared/design-tokens.json) + [`components/`](components/).
> Versões conferidas no registro npm em 2026-10-02; Playwright reconferido em 2026-10-16
> (`npm view playwright version` → 1.64.1).

## Runtime e linguagem

| Item | Recomendada | Aceita | Observação |
|---|---|---|---|
| Node.js | 24.x | 22.x | `.nvmrc` + `engines`; Angular 22 exige `^22.22.3 \|\| ^24.15.0 \|\| >=26` |
| Angular | 22.2.x | 21.2.x | App nova em 22; 21 só para app existente (EOL 2027-06-30) |
| TypeScript | 6.0.x | 5.9.x (só Angular 21) | Angular 22 exige `>=6.0 <6.1` |
| RxJS | 7.8.x | — | Só para fluxo assíncrono; estado é Signal (ver [`architecture.md`](architecture.md)) |

`tsconfig`: `strict: true`, `noImplicitOverride`, `noImplicitReturns`,
`noFallthroughCasesInSwitch`, `noPropertyAccessFromIndexSignature`,
`exactOptionalPropertyTypes`. `angularCompilerOptions`: `strictTemplates`,
`strictInjectionParameters`, `strictInputAccessModifiers`, `extendedDiagnostics` com
categoria `error`. Path alias: `@app/* → src/app/*`.

## Framework e UI

| Biblioteca | Uso |
|---|---|
| `@angular/core` 22 — standalone, **zoneless** (`provideZonelessChangeDetection`) | Sem `zone.js` no bundle; sem `NgModule` em código novo |
| `@angular/router` | Rotas lazy (`loadComponent`/`loadChildren`), guards e resolvers funcionais, `withComponentInputBinding` |
| `@angular/build` (application builder, esbuild + Vite dev server) | Build e dev server; `@angular-devkit/build-angular` proibido em projeto novo |
| `@angular/cdk` 22 | Primitivos headless: overlay, dialog, menu, listbox, a11y (`FocusTrap`, `LiveAnnouncer`), drag-drop |
| Tailwind CSS 4.x | Estilização utilitária consumindo os tokens do design system |
| `class-variance-authority` 0.7 + `clsx` + `tailwind-merge` 3 | Variantes e mesclagem de classes (`cn()`) |
| `@ng-icons/core` + `@ng-icons/phosphor-icons` 36.x (Angular 22) / 33.x (Angular 21) | Ícones Phosphor — mesma família do Next.js |
| `@angular/localize` | i18n com locale `pt-BR` registrado (`registerLocaleData`) |

`@angular/material` não entra: a linguagem visual é a do design system Banestes, não Material.
`@angular/aria` exige DR antes do uso.

## Estado e dados

| Biblioteca | Uso |
|---|---|
| Signals (`signal`, `computed`, `linkedSignal`, `effect`) | Estado local e derivado |
| `@ngrx/signals` 22 (SignalStore) | Estado de feature e estado global de cliente (item selecionado, preferências de UI). **Não** guarda a sessão nem outro estado de servidor |
| `HttpClient` (`provideHttpClient(withFetch(), withInterceptors(...), withXsrfConfiguration(...))`) | Única via de I/O HTTP, sempre para `/api/*` do BFF |
| `rxResource` / `httpResource` | Leitura reativa de servidor ligada a Signals — inclusive a sessão (`GET /auth/session`), num serviço de raiz de `core/auth` |
| Reactive Forms tipados (`FormBuilder.nonNullable`) | Formulários |
| `zod` 4 | Validação de payload na fronteira HTTP e schemas de domínio reutilizáveis |
| `dayjs` 1.11 (locale `pt-br`) | Datas |
| `imask` | Máscaras de input (CPF/CNPJ, moeda, data) |

`@ngrx/store` (Redux clássico) não entra em app nova.

## Segurança (libs)

| Biblioteca | Uso |
|---|---|
| `DomSanitizer` / sanitização nativa do Angular | HTML dinâmico |
| `withXsrfConfiguration` (`XSRF-TOKEN` / `X-XSRF-TOKEN`) | CSRF double-submit com o BFF |

Nenhuma lib OIDC no browser — ver [`security.md`](security.md).

## Qualidade e build

| Ferramenta | Uso |
|---|---|
| ESLint 10 (flat, `eslint.config.js`) + `angular-eslint` 22 + `typescript-eslint` 8 (`projectService`) | Regras TS type-aware, templates e acessibilidade de template (`@angular-eslint/template/accessibility`) |
| `no-restricted-imports` (regra nativa do ESLint) | Fronteiras entre camadas e features — config em [`architecture.md`](architecture.md) §3 |
| Prettier 3 | `singleQuote`, `semi`, `trailingComma: all`, `printWidth: 100`, `endOfLine: lf`; parser `angular` para templates |
| Jest 30 + `jest-preset-angular` + `jest-environment-jsdom` (TestBed zoneless; `@swc/jest` ou o transformador do preset) | Testes de unidade e componente. Jest é o **único** executor de testes: é o que o `Jenkinsfile-Build-nodejs` roda (com `RUN_UNIT_TESTS=true`, `jest.config.js` e `jest-junit`, ver [`../_shared/spa-bff.md`](../_shared/spa-bff.md) §7); Karma/Jasmine proibidos em projeto novo. **Confirmar no primeiro sistema** (nota abaixo) |
| `@testing-library/angular` 19 + `@testing-library/user-event` | Testes de componente orientados a comportamento |
| Playwright 1.64 + `@axe-core/playwright` | E2E e varredura de acessibilidade |
| Storybook 10 (`@storybook/angular`, addon-a11y, addon-themes) | Catálogo de componentes |
| `knip` | Código e dependência morta |
| Husky + `lint-staged` + `@commitlint/config-conventional` | Hooks de commit (ver [`_shared/git-workflow.md`](../../_shared/git-workflow.md)) |
| SonarQube | Regras em [`../_shared/sonar-frontend.md`](../_shared/sonar-frontend.md) |

> **Nota — Jest + Angular 22 zoneless não verificado.** A troca do executor de Vitest para Jest
> (decisão: o `Jenkinsfile-Build-nodejs` só roda Jest) foi feita sem rodar a combinação `jest` +
> `jest-preset-angular` + Angular 22 zoneless. A coleção não fixa versão de `jest`,
> `jest-preset-angular`, `jest-environment-jsdom` nem do transformador; o primeiro sistema Angular
> confirma a compatibilidade (inicialização do TestBed zoneless, ESM do Angular 22, escolha entre
> `@swc/jest` e o transformador do preset) e fixa as versões aqui, como a coleção React fez com
> o `package.json` de referência.

`eslint-plugin-boundaries` não entra: a versão 7 puxa `handlebars` (CVE Critical) e `braces`
(High) sem correção, e a política de
[`_shared/vulnerable-and-proprietary-libs.md`](../../_shared/vulnerable-and-proprietary-libs.md)
bloqueia — o waiver não cobre Critical. As fronteiras usam `no-restricted-imports`.

## Infra

- **Deploy:** a SPA é publicada **junto com o BFF** numa aplicação `APP_TYPE=nodejs`, e o BFF serve
  os estáticos ([`../_shared/spa-bff.md`](../_shared/spa-bff.md) §2.1). O tipo `angular` da esteira
  (estáticos em Apache httpd) não serve SPA autenticada.
  Configuração por ambiente via `config.json`, servido pelo BFF a partir de variável do `ConfigMap` — ver [`../_shared/spa-bff.md`](../_shared/spa-bff.md) §4.
  `ConfigMap` e `Secret` do BFF em `configuration/configmap/<app>.yml` e `configuration/secret/<app>.yml`, só de desenvolvimento
  ([`_shared/operations-and-readiness.md`](../../_shared/operations-and-readiness.md) §2.2).
- **Observabilidade:** AppDynamics Browser RUM; ID vem do `config.json`.
- Certificado corporativo no build: `NODE_EXTRA_CA_CERTS=./ca_banestes.pem`.
- **Registro npm:** instalação via o espelho corporativo (Nexus), nunca o registro público direto —
  ver [`_shared/vulnerable-and-proprietary-libs.md`](../../_shared/vulnerable-and-proprietary-libs.md) §2.
- **`outputPath`.** O BFF serve o `outputPath` do `angular.json`, declarado num único lugar e lido
  pelo BFF. Só um **site estático sem autenticação** publicado como `angular` precisa de
  `outputPath` literalmente `dist/<APP_NAME>/` (nome da aplicação na esteira, o mesmo de
  `configuration/configmap/<app>.yml` — nomes acoplados,
  [`_shared/operations-and-readiness.md`](../../_shared/operations-and-readiness.md) §3), porque o
  Exportar do `Jenkinsfile-Build-httpd` empacota esse caminho fixo.
- **Esteira:** Jenkins/OCP4, `Jenkinsfile-Build-nodejs` (ver
  [`_shared/architecture-principles.md`](../../_shared/architecture-principles.md), "Tipos de
  aplicação da esteira", e [`_shared/operations-and-readiness.md`](../../_shared/operations-and-readiness.md) §2.1).

## Versionamento

Versões fixas via `package-lock.json` commitado; atualização conforme
[`../_shared/version-policy.md`](../_shared/version-policy.md) e
[`_shared/vulnerable-and-proprietary-libs.md`](../../_shared/vulnerable-and-proprietary-libs.md).
