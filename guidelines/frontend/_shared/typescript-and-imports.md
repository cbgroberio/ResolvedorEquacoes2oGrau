# TypeScript, imports e estilo de código (frontend)

> Convenções de TypeScript que valem para toda coleção de frontend (`nextjs`, `react`,
> `angular`). O que é de framework (hooks, Signals, `'use client'`, nomenclatura de
> artefatos) fica em `frontend/<stack>/coding-standards.md`. A fonte da verdade executável é
> o `eslint.config`, o `.prettierrc` e o `tsconfig.json` do sistema; este documento resume o
> contrato.

## TypeScript

- `strict` sempre. `any` é erro (`@typescript-eslint/no-explicit-any`): usar `unknown` +
  narrowing.
- Import de tipo com `import { type X }` inline (`consistent-type-imports`,
  `fixStyle: 'inline-type-imports'`).
- `catch (e: unknown)` (`useUnknownInCatchVariables`): fazer narrow antes de usar.
- `switch` sobre union é exaustivo (`switch-exhaustiveness-check`,
  `noFallthroughCasesInSwitch`).
- Supressão de tipo: preferir `@ts-expect-error` com descrição; `@ts-ignore` só com descrição
  (a coleção pode proibi-lo).
- Sem variável nem parâmetro não usado (prefixo `_` para o intencional).

`type` versus `interface` e o uso de `!` (non-null assertion) variam por coleção: ver o
`coding-standards.md` da stack.

## Imports

- Ordem, com linha em branco entre grupos e ordem alfabética dentro de cada um: pacotes do
  framework (`react`) → demais bibliotecas → alias do sistema (`@/…` em React e Next.js,
  `@app/…` em Angular) → imports relativos. O Next.js acrescenta o grupo `next` logo depois
  de `react`.
- Sem import duplicado, sem self-import, sem segmento de path inútil.
- Alias do sistema para sair da pasta; relativo só dentro da mesma pasta ou feature.
- A ordem é verificada pela ferramenta de lint do sistema (no Next.js,
  `import-helpers/order-imports`); sem plugin configurado, vale como convenção de revisão.

## Estilo

- Prettier sem formatação manual (opções em `stack.md` de cada coleção).
- `eqeqeq`, `prefer-const`, `no-var`, `object-shorthand`, `no-param-reassign` (não mutar
  parâmetro).
- Promises: `no-floating-promises`; `await` só em thenable; `only-throw-error` (lançar
  `Error`).
- **Promise não aguardada sem `void`.** O `no-floating-promises` aceita `void promessa`, mas o Sonar
  acusa `void` como Critical (S3735). Em handler síncrono (`onClick`) ou callback tipado como `void`
  (ex.: `onSuccess` do TanStack Query), onde `await` não cabe (`no-misused-promises`), a promessa
  termina em `.catch(<função nomeada>)` que registra ou exibe o erro. O operador `void` não é usado.

## Proibido silenciar análise

Sem `// eslint-disable` sem justificativa na mesma linha, sem supressão de tipo sem descrição,
sem `any` para "fazer passar". Corrigir estruturalmente.

## Checklist

- [ ] Sem `any`; import de tipo inline; `@ts-expect-error` com descrição
- [ ] `switch` exaustivo sobre union; `catch (e: unknown)` com narrow
- [ ] Imports na ordem dos grupos; alias do sistema; sem duplicado
- [ ] `eqeqeq`, `prefer-const`, sem mutar parâmetro; promises tratadas
- [ ] Nenhuma supressão de lint/TS sem justificativa
