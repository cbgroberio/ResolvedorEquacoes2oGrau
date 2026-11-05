# Testes — Frontend React (SPA)

> Runner: Jest 30 (`jsdom`), único executor de testes, com config em `jest.config.js` (receita em §6).
> O nome `jest.config.js` é literal: o `Jenkinsfile-Build-nodejs` procura esse arquivo e a string
> `jest-junit` dentro dele, e falha com `.mjs` ou `.ts`. Com `"type": "module"` no `package.json`
> (padrão do Vite), o `.js` já é ESM.
> Rede: MSW. E2E: Playwright. Catálogo: Storybook. Gate de pronto: [`definition-of-done.md`](definition-of-done.md).
> Contrato HTTP verificado contra [`_shared/api-standards.md`](../../_shared/api-standards.md).

## 1. Estratégia por tipo

| Alvo | Ferramenta | Foco |
|---|---|---|
| Funções puras, schemas Zod | Jest | Entrada → saída; bordas; aceitação e rejeição |
| Funções de `api/` | Jest + MSW | Request enviado, parsing Zod da resposta, erro → `ProblemDetails` |
| Hooks React Query e Zustand | Testing Library (`renderHook`) + MSW + `QueryClient` de teste | Estados `pending`/`success`/`error`, invalidação |
| Componentes | Testing Library + `user-event` (+ `axe-core` para a11y) | Comportamento visível ao usuário; sem violação WCAG 2.1 AA do que está montado |
| Rotas | `createMemoryRouter` + Testing Library + MSW | Navegação, loader, `errorElement` |
| Fluxos críticos | Playwright contra `vite preview` com BFF mockado | Jornada ponta a ponta; `@axe-core/playwright` sem violação |
| Catálogo visual / a11y | Storybook 10 + addon-a11y (+ MSW addon) | Estados e temas claro/escuro |

## 2. Convenções

- Arquivo `*.test.ts(x)` ao lado do alvo; E2E em `e2e/<feature>/*.spec.ts`.
- Handlers MSW por feature em `features/<feature>/api/mocks.ts` e, para domínio compartilhado,
  em `shared/<assunto>/api/mocks.ts`, reaproveitados em teste, Storybook e dev.
- `QueryClient` novo por teste, com `retry: false`.
- `server.listen({ onUnhandledFrame: 'error' })` no servidor MSW (nome da opção no MSW 3; o
  antigo `onUnhandledRequest` o TypeScript recusa) — requisição não mockada falha o teste.

## 3. Testing Library — regras

- Consultar por papel/label/texto; `data-testid` só em último caso.
- Interação com `userEvent`, não `fireEvent`.
- `findBy*` para assíncrono; sem `act` manual desnecessário.
- Testar o que o usuário vê; não asserir sobre estado interno de hook ou store.

### Acessibilidade em teste de componente

Componente e página com formulário, diálogo ou tabela têm ao menos um teste que roda o
`axe-core` sobre o que foi montado (pacote `axe-core`, par exigido — ver
[`stack.md`](stack.md)). Um helper único em `src/test/a11y.ts` evita repetir a configuração:

```ts
import axe from 'axe-core';
import { expect } from '@jest/globals';

export async function expectNoA11yViolations(container: HTMLElement): Promise<void> {
  const results = await axe.run(container, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
    rules: { 'color-contrast': { enabled: false } }, // jsdom não calcula cor nem layout
  });
  expect(results.violations.map((v) => v.id)).toEqual([]);
}
```

No teste: `const { container } = render(<Tela />); await expectNoA11yViolations(container);`.
O jsdom não mede contraste nem layout: contraste e temas ficam no e2e
(`@axe-core/playwright`) e no addon-a11y do Storybook.

## 4. Contrato HTTP

Toda função de `api/` tem teste que verifica: request exato (método, URL, corpo), resposta
válida parseada, resposta inválida rejeitada pelo schema e erro 4xx/5xx convertido em
`ProblemDetails`. O formato de erro de teste é o oficial: `type` URN por categoria,
`codigoRegra`, `dadosApoio` e `errors[{field, message}]` (o texto exibido vem do catálogo da
aplicação por `codigoRegra`; sem entrada, usa `detail`). Listagem: a resposta de teste é a página
`{content, page, size, totalElements, totalPages}`.

## 5. Cobertura

A cobertura é **gerada** (`npm run test:coverage` = `jest --coverage`, `coverageProvider: 'v8'`,
reporter `lcov` em `coverage/lcov.info`; nenhum pacote extra); o gate de código novo é o do
SonarQube no servidor ([`../_shared/sonar-frontend.md`](../_shared/sonar-frontend.md)), com cobertura ≥ 75%
([`../../_shared/sonar-quality-gate.md`](../../_shared/sonar-quality-gate.md)), medida pelo `lcov` local enquanto a esteira excluir `.tsx`. Prioridade: `api/`, schemas, stores,
`lib/http` e fluxos críticos.

## 6. Receita Jest para SPA com Vite

Jest é o **único** executor de testes: o `Jenkinsfile-Build-nodejs`, caminho da SPA com BFF, só roda
Jest (com `RUN_UNIT_TESTS=true`, `jest.config.js` e `jest-junit`, `../_shared/spa-bff.md` §7). O `vite.config.ts`
deixa de ser configuração de teste (fica só com build e dev server). Storybook e Playwright
não são executores de CI de teste unitário: o Storybook é catálogo e o Playwright roda o e2e
(`npm run test:e2e`). Receita conferida no primeiro sistema (eleições internas).

### 6.1 Arquivos de configuração

| Arquivo | Conteúdo |
|---|---|
| `jest.config.js` | Projeto `web` (`testEnvironment` próprio com jsdom, `testMatch` `src/**/*.test.{ts,tsx}`) e, se houver BFF Node no repositório, projeto `server` (`testEnvironment: 'node'`). `transform` do `jest.transform.cjs`; `transformIgnorePatterns: []` (todo `node_modules` passa pelo transformador, porque `msw` 3 e `react-router` 8 só têm build ESM; o cache do Jest torna barato depois da primeira execução); `clearMocks` e `restoreMocks`; `coverageProvider: 'v8'`, reporters `text-summary` e `lcov`; `reporters` com `default` e `jest-junit` (saída em `reports/junit.xml`, exigida pela esteira); `collectCoverageFrom` excluindo testes, `src/test/**` e mocks |
| `moduleNameMapper` (projeto `web`) | `^@/(.*)$` → `<rootDir>/src/$1` (alias do `tsconfig`); `^axios$` → build de navegador do `axios` em `node_modules/axios/dist/browser/axios.cjs` (o XHR do jsdom é o que o MSW intercepta, o mesmo adaptador de produção); `.*/vite-env$` → stub em `src/test/vite-env.ts` |
| `jest.transform.cjs` | `@swc/jest` (`createTransformer`) com parser TS/TSX, `react.runtime: 'automatic'` e `module.type: 'commonjs'`, mais a troca textual de `import.meta` antes do swc (`import.meta.hot` → `undefined`, `import.meta.env` → `({})`, `import.meta.url` → URL do `__filename`), porque `import.meta` não existe em CommonJS e os pacotes ESM de terceiros o usam. O `getCacheKey` aplica a mesma troca |
| `jest.environment.cjs` | Estende `jest-environment-jsdom` e injeta no `global` o que o MSW 3 precisa do Node: `fetch`, `Request`, `Response`, `Headers`, streams (`ReadableStream`, `WritableStream`, `TransformStream`, `TextEncoderStream`, `TextDecoderStream`), `TextEncoder`/`TextDecoder`, `AbortController`/`AbortSignal`, `structuredClone`, `BroadcastChannel`. `Blob`, `FormData` e `URL` continuam os do jsdom. Define `customExportConditions = ['']` (e o mesmo em `testEnvironmentOptions`): sem a condição de exportação `browser`, o `msw/node` acha a exportação de Node |
| `src/test/jest-globals.ts` | `setupFiles` (roda **antes** do ambiente de teste): devolve `setImmediate`/`clearImmediate` de `node:timers` ao `globalThis`, que o jsdom remove e o interceptor do MSW 3 usa |
| `src/test/setup.ts` | `setupFilesAfterEnv`: `@testing-library/jest-dom/jest-globals`, stub de `ResizeObserver` (o jsdom não tem; os primitivos Radix usam), `server.listen({ onUnhandledFrame: 'error' })` em `beforeAll` e, em `afterEach`, `cleanup()`, `server.resetHandlers()` e limpeza de `localStorage`/`sessionStorage` e dos singletons de módulo |
| `src/test/vite-env.ts` | Stub do módulo que isola `import.meta.env` (regras abaixo) |
| `src/test/a11y.ts` | Helper do `axe-core` (§3) |
| `src/test/read-sources.ts` | Helper de teste de varredura de código-fonte (ex.: sem dado pessoal em dado de teste), quando o sistema tiver um |
| `package.json` | `"test": "jest"` e `"test:coverage": "jest --coverage"`; devDependencies fixas em [`stack.md`](stack.md) ("Pares exigidos por tooling") |

### 6.2 Regras

- **Globais sempre importados de `@jest/globals`** (`describe`, `it`, `expect`, `jest`,
  `beforeAll`...).
- **`jest.mock` com módulo importado** exige o `jest` **global** (sem importá-lo de
  `@jest/globals` naquele arquivo): é o que o swc reconhece para elevar (*hoist*) a chamada
  acima dos `import`. Preferir MSW a `jest.mock` para rede; `jest.mock` fica para módulos do
  próprio sistema.
- **`import.meta.env` e `import.meta.glob` ficam isolados** num único módulo (ex.:
  `src/lib/vite-env.ts`) que o Jest substitui por stub via `moduleNameMapper`. Nenhum outro
  arquivo de `src/` os usa.
- **`server.listen({ onUnhandledFrame: 'error' })`**: requisição sem handler falha o teste.
- **O jsdom não tem `Blob.text()`**: código de produção que lê o `Blob` de uma resposta de erro
  usa `FileReader`, não `blob.text()`.
- **O Jest só casa `*.test.ts(x)`** em `src/` (e `server/`, se houver). `e2e/**/*.spec.ts` é do
  Playwright e não pode ser executado pelo Jest.
- **Sem limiar local de cobertura** (`coverageThreshold` ausente): o gate é o do SonarQube.
- **Acessibilidade:** a11y de componente com `axe-core` (§3); contraste e temas só no e2e
  (`@axe-core/playwright`), porque o jsdom não calcula cor nem layout.

## 7. Protocolo para a IA

1. Ao criar componente/hook/função de `api/`, criar o `.test.ts(x)` ao lado.
2. Rede sempre por MSW — nunca mockar `axios` diretamente nem chamar o BFF real.
3. Função de `api/`: cobrir 2xx, payload inválido e erro com Problem Details.
4. Query por acessibilidade; interação com `userEvent`.
5. Teste instável não leva `skip` — corrigir a causa (timer, await, cleanup).
6. Importar `describe`/`it`/`expect`/`jest` de `@jest/globals`; nunca de `vitest`. Não usar
   `import.meta.env` fora do módulo isolado.
7. Nenhum `vitest.config.*` nem script de teste que não seja o `jest`.
