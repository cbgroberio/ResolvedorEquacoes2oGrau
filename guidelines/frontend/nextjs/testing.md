# Testes — Frontend Next.js

> Config real: `jest.config.js` (`next/jest`), `jest.setup.js`, `tsconfig` (`types: jest,
> @testing-library/jest-dom`). Ambiente `jest-environment-jsdom`.
> O nome `jest.config.js` é literal: o `Jenkinsfile-Build-nodejs` procura esse arquivo com a string
> `jest-junit` (reporter com saída em `reports/junit.xml`) e falha com `.mjs` ou `.ts`. Sem
> `"type": "module"` no `package.json`, o arquivo é CommonJS (`require('next/jest')`).
> A configuração de Jest da SPA (Vite) difere da do `next/jest`: não copie `jest.config`, `setup`
> nem mapeamento de módulos de uma coleção para a outra.

## 1. Estratégia por tipo

| Alvo | Ferramenta | Foco |
|---|---|---|
| Funções puras (`utils/`, `schemas/`, `routes/`, `lib/feature-access`) | Jest | Entrada → saída; casos de borda; parsing de schema Zod |
| Hooks | Testing Library (`renderHook`) | Estado e efeitos observáveis |
| Componentes | Testing Library (`render`, `screen`, `userEvent`) | Comportamento visível ao usuário, não implementação |
| Route handlers (`app/api/*`) | Jest | Status semântico, corpo modelado, tratamento de erro do upstream (mock do axios) |
| Fluxos críticos | Playwright contra o artefato (`npm run build` + `npm start`) com login no RHBK de dev ou identidade simulada | Jornada ponta a ponta; página hidrata com a CSP ligada; `@axe-core/playwright` sem violação (§7) |
| Acessibilidade / visual | Storybook 10 + `addon-a11y` | Estados do componente e violações a11y |

## 2. Convenções

- Arquivo `*.test.ts(x)` em `__tests__/` colocado ao lado do alvo (padrão já usado em
  `utils/**/__tests__`, `components/__tests__`, `routes/__tests__`, `lib/feature-access/__tests__`).
- `testMatch`: `src/**/*.{test,spec}.{js,jsx,ts,tsx}`. `passWithNoTests` ligado — ausência de
  teste não quebra o build, mas ver DoD.
- E2E em `e2e/<feature>/*.spec.ts`, **fora de `src/`**: o Jest não casa nada fora de `src/` e não
  pode executar o e2e.
- Alias `@/` resolvido no Jest (`moduleNameMapper`).

## 3. Testing Library — regras

- Consultar por papel/label/texto (`getByRole`, `getByLabelText`), nunca por classe CSS ou
  `data-testid` a não ser em último caso.
- Interação com `userEvent`, não `fireEvent`.
- `findBy*` / `waitFor` para assíncrono; sem `act` manual desnecessário.
- Mock de rede: mockar o módulo `@/lib/axios` ou a camada de fetch — não a API real.
- Testar o que o usuário vê e faz; não asserir sobre estado interno de hook/Redux.

## 4. Schemas Zod

Todo schema de domínio em `src/schemas/` tem teste cobrindo: valor válido, cada regra de
rejeição, e coerção/transform quando houver.

## 5. Cobertura

Ver [`definition-of-done.md`](definition-of-done.md). A cobertura é gerada pelo teste e lida pelo
SonarQube; o Quality Gate exige cobertura ≥ 75% ([`../../_shared/sonar-quality-gate.md`](../../_shared/sonar-quality-gate.md)), medida pelo `lcov` local enquanto a esteira excluir `.tsx`
([`../_shared/sonar-frontend.md`](../_shared/sonar-frontend.md)). Prioridade de cobertura: `utils/`,
`schemas/`, `lib/feature-access`, route handlers e fluxos críticos (login, PIX, pagamento).

## 6. Protocolo para a IA

1. Ao criar componente/hook/util, criar o `__tests__/` correspondente na mesma pasta.
2. Query por acessibilidade; interação com `userEvent`.
3. Mockar `@/lib/axios`, nunca chamar gateway.
4. Para route handler, cobrir 2xx, erro de validação (400), regra de negócio (409/422) e erro do
   upstream. Erro com código: afirmar que a UI mostra o texto do catálogo para `codigoRegra` (com
   `dadosApoio` interpolado), que sem entrada cai no catálogo da categoria e, sem catálogo, no
   `detail`; erro de campo mostra o `message` junto do campo. Lista paginada: fixture de página
   plana `{ content, page, size, totalElements, totalPages }`.
5. Não silenciar teste flaky com `skip` — corrigir a causa (timer, await, cleanup).
6. **Smoke do artefato:** depois do `npm run build`, subir o artefato com `npm start` e conferir que
   `/health` responde `200` sem sessão e sem `3xx`, e que o HTML aponta para CSS e JS que carregam
   (`200`). O CI roda este passo nas mesmas condições do build da esteira.

## 7. E2E (Playwright)

Mesmo papel do e2e das coleções React e Angular (jornada ponta a ponta e acessibilidade que o
jsdom não mede), adaptado ao Next: a aplicação **é** o BFF, então o e2e roda contra o servidor
Next, não contra um BFF mockado.

- **Ferramenta:** `@playwright/test` 1.64 + `@axe-core/playwright`, em `devDependencies`; script
  `"test:e2e": "playwright test"`; configuração em `playwright.config.ts` com `testDir: './e2e'`.
- **Alvo:** o artefato (`npm run build` + `npm start`), pela URL em `E2E_BASE_URL` (padrão
  `http://localhost:3000`). O `next dev` serve para escrever o teste, não como evidência: ele não
  aplica as mesmas condições do build (CSP de produção, sem `'unsafe-eval'`).
- **Autenticação:** login real no RHBK de dev — um projeto `login`, com navegador visível, espera a
  pessoa entrar e salva o `storageState` em `e2e/.auth/` (credencial: no `.gitignore`, conferido com
  `git check-ignore -v`); os demais projetos reaproveitam a sessão. Alternativa: identidade simulada,
  só com `APP_ENV` development/test ([`../../_shared/identity-rhsso.md`](../../_shared/identity-rhsso.md) §7).
  Senha nunca em arquivo, variável versionada ou código do teste.
- **Navegador:** quando a rede não permite baixar o navegador do CDN do Playwright, usar o instalado
  na máquina (`channel: 'msedge'` ou `'chrome'`), sobrescrevível por variável.
- **Artefatos fora do projeto:** `outputDir` e relatório HTML em pasta temporária
  (`join(os.tmpdir(), '<app>-e2e', ...)`). Dentro do projeto, o `next dev` observa as capturas e
  recarrega a página em laço, e o lixo corre risco de ir para o git.
- **O que cobre, no mínimo:** login completo voltando ao `returnTo`; em cada tela de fluxo crítico,
  uma interação que só funciona com a página hidratada (prova a CSP com nonce,
  [`security.md`](security.md) §5.1); acesso negado sem a permissão; `@axe-core/playwright` (WCAG 2.1
  AA) em cada tela, nos temas claro e escuro, porque contraste e tema o jsdom não calcula.
- **Fora da esteira:** o `Jenkinsfile-Build-nodejs` só roda Jest. O e2e roda na máquina (ou CI
  próprio) antes do PR que altera fluxo crítico, e a evidência (lista dos testes verdes) vai no PR,
  como lint e typecheck ([`../../_shared/architecture-principles.md`](../../_shared/architecture-principles.md) §10).
- Sem `test.skip`/`test.only` versionado; teste instável corrigido na causa (espera por estado
  visível, não `waitForTimeout`).
