# Testes — Frontend Angular

> Runner: Jest com `jest-preset-angular` (`npm test`), ambiente `jsdom`, único executor de
> testes (o `Jenkinsfile-Build-nodejs`, caminho da SPA com BFF, só roda Jest). E2E: Playwright. Catálogo: Storybook. Gate de
> pronto: [`definition-of-done.md`](definition-of-done.md).
> **Confirmar no primeiro sistema:** a combinação Jest + Angular 22 zoneless não foi verificada
> (ver §7).
> Contrato HTTP verificado contra [`_shared/api-standards.md`](../../_shared/api-standards.md).

## 1. Estratégia por tipo

| Alvo | Ferramenta | Foco |
|---|---|---|
| Funções puras, schemas Zod, pipes | Jest | Entrada → saída; bordas; aceitação e rejeição do schema |
| SignalStore | Jest + `TestBed` | Estado inicial, transições por método, `computed` derivados |
| API client (`data-access`) | Jest + `provideHttpClientTesting` (`HttpTestingController`) | URL/método/corpo enviados; parsing Zod da resposta; erro → `ProblemDetails` |
| Interceptors e guards | Jest + `TestBed.runInInjectionContext` | 401 → redirect, correlação, mapeamento de erro |
| Componentes | `@testing-library/angular` + `user-event` | Comportamento visível: render por `input`, interação, `output` emitido |
| Primitivos do design system | Testing Library + CDK component harnesses | Teclado, foco, ARIA, variantes |
| Fluxos críticos | Playwright contra build de produção com BFF mockado | Jornada ponta a ponta; `@axe-core/playwright` sem violação |
| Catálogo visual / a11y | Storybook 10 + addon-a11y | Estados e temas claro/escuro |

## 2. Convenções

- Arquivo `*.spec.ts` ao lado do alvo (`chave-pix-card.ts` → `chave-pix-card.spec.ts`).
- E2E em `e2e/<feature>/*.spec.ts`; mocks do BFF com `page.route('/api/**')`.
- Providers mínimos por teste: `provideZonelessChangeDetection()` sempre presente — o teste
  roda no mesmo modelo de change detection da produção.
- Sem `fakeAsync`/`waitForAsync` (dependem de `zone.js`): usar `jest.useFakeTimers()` e
  `await fixture.whenStable()`.
- Globais (`describe`, `it`, `expect`, `jest`) importados de `@jest/globals`.

## 3. Testing Library — regras

- Consultar por papel/label/texto (`getByRole`, `getByLabelText`); `data-testid` só em
  último caso.
- Interação com `userEvent`, não `fireEvent` nem `nativeElement.click()`.
- `findBy*` para assíncrono.
- Testar o que o usuário vê; não asserir sobre signal privado nem método interno.
- Rede sempre mockada (`HttpTestingController` ou store fake) — nunca o BFF real.

## 4. Contrato HTTP

Todo método de API client tem teste que verifica: request exato (método, URL, corpo),
resposta válida parseada, resposta inválida rejeitada pelo schema e erro 4xx/5xx convertido
em `ProblemDetails`, no formato oficial: `type` URN por categoria, `codigoRegra`, `dadosApoio` e
`errors[{field, message}]` (o texto exibido vem do catálogo da aplicação por `codigoRegra`; sem
entrada, usa `detail`). Listagem: a resposta de teste é a página
`{content, page, size, totalElements, totalPages}`.

## 5. Cobertura

A cobertura é **gerada** (`npm run test:coverage` = `jest --coverage`, `coverageProvider: 'v8'`,
reporter `lcov` em `coverage/lcov.info`); o gate de
código novo é o do SonarQube no servidor ([`../_shared/sonar-frontend.md`](../_shared/sonar-frontend.md)).
O Quality Gate exige cobertura ≥ 75% ([`../../_shared/sonar-quality-gate.md`](../../_shared/sonar-quality-gate.md)); enquanto a esteira excluir `.tsx` da cobertura, a medida é o `lcov` local anexado ao PR ([`../_shared/sonar-frontend.md`](../_shared/sonar-frontend.md), "Notas da biblioteca"). Prioridade:
`data-access`, stores, schemas, interceptors e fluxos críticos.

## 6. Configuração do Jest

- `jest.config` com o preset `jest-preset-angular`, `testEnvironment` jsdom e `setupFilesAfterEnv`
  que inicializa o TestBed zoneless (`provideZonelessChangeDetection()`), sem `zone.js` nem
  `setup-zone`.
- Transformação por `@swc/jest` ou pelo transformador do preset (decidir no primeiro sistema).
- `testMatch` restrito a `src/**/*.spec.ts` e **excluindo `e2e/`**: o teste unitário e o Playwright
  usam ambos `*.spec.ts`, e o Jest não pode executar o e2e.
- `HttpTestingController` (`provideHttpClientTesting`) continua o meio de testar HTTP; rede real
  nunca.
- Sem `coverageThreshold` local: o gate é o do SonarQube.
- `package.json`: `"test": "jest"` e `"test:coverage": "jest --coverage"`. Nada de `ng test`,
  Karma, Jasmine ou `@angular/build:unit-test`.

## 7. Nota de verificação

A combinação Jest + Angular 22 zoneless **não foi verificada** quando esta coleção adotou o Jest
(decisão do usuário: o `Jenkinsfile-Build-nodejs` só roda Jest). Confirmar no primeiro sistema: preset
compatível com Angular 22, TestBed zoneless sob Jest, transformador (`@swc/jest` ou o do preset) e
as versões fixas; então registrar o resultado em [`stack.md`](stack.md) e retirar este aviso.

## 8. Protocolo para a IA

1. Ao criar componente/store/API client/pipe, criar o `.spec.ts` ao lado.
2. Componente: renderizar com `render()` da Testing Library, passando `inputs`.
3. API client: cobrir 2xx, payload inválido e erro com Problem Details.
4. Nunca importar `zone.js` nem usar `fakeAsync` para fazer teste passar.
5. Teste instável não leva `skip` — corrigir a causa (timer, await, cleanup).
6. Importar `describe`/`it`/`expect`/`jest` de `@jest/globals`; nunca de `vitest`. Rodar com `npm test`.
