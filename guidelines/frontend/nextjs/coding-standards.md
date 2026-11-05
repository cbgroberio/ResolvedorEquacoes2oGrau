# Padrões de Código — Frontend Next.js

> Fonte da verdade executável: `eslint.config.mjs`, `.prettierrc.js`, `tsconfig.json` do
> sistema. Este documento resume o contrato e o que o lint não pega.
> Commits: [`_shared/git-workflow.md`](../../_shared/git-workflow.md). Logs: [`_shared/logging-and-levels.md`](../../_shared/logging-and-levels.md).

## TypeScript

Base comum em [`../_shared/typescript-and-imports.md`](../_shared/typescript-and-imports.md)
(`strict`, `any` proibido, import de tipo inline, `catch (e: unknown)`, `switch` exaustivo,
supressão de tipo com descrição, sem não usado). Neste projeto, além disso:

- **`type`, nunca `interface`** (`consistent-type-definitions: ['error', 'type']`).

## React

- `react/react-in-jsx-scope` off (React 19). `prop-types` off — tipar props com `type`.
- Sem componente aninhado instável (`no-unstable-nested-components`), sem valor de contexto
  construído inline (`jsx-no-constructed-context-values` — memoizar).
- `key` real em lista; `no-array-index-key` (warn) — evitar índice como key.
- `self-closing-comp`, `jsx-boolean-value`, `jsx-curly-brace-presence` (sem `{'texto'}`).
- Hooks: `rules-of-hooks` (error), `exhaustive-deps` (warn — resolver, não silenciar).
- `'use client'` só quando necessário (ver [`architecture.md`](architecture.md) §4).

## Imports

Ordem e regras comuns em [`../_shared/typescript-and-imports.md`](../_shared/typescript-and-imports.md).
No Next.js a ordem é automática (`import-helpers/order-imports`): `react` → `next` → libs →
`@/…` → `~` → relativos; linha em branco entre grupos; alfabético. Usar alias `@/`.

## Nomenclatura

| Artefato | Convenção | Exemplo |
|---|---|---|
| Arquivo / pasta | kebab-case (pt_BR em termo de negócio) | `formatar-valor-brl.ts`, `minhas-chaves/` |
| Componente React | PascalCase | `ChavesPixCard` |
| Hook | `use-` + kebab no arquivo, camelCase no símbolo | `use-feature-access.ts` → `useFeatureAccess` |
| Schema Zod | `*.schema.ts` | `chave-pix.schema.ts` |
| Route handler | `route.ts` na pasta do recurso | `app/api/pix/route.ts` |
| Constante | UPPER_SNAKE_CASE | `MAX_TENTATIVAS` |
| Tipo | PascalCase | `type TipoChavePix` |

## Estilo

- Prettier: aspas simples, `;`, `trailingComma: all`, 2 espaços, LF. Sem formatação manual.
- `eqeqeq` smart, `no-var`, `prefer-const`, `object-shorthand`, `no-unneeded-ternary`,
  `prefer-for-of`.
- `no-param-reassign` (warn) — não mutar parâmetro.
- Promises: sem `no-floating-promises`; `await` só em thenable; `only-throw-error` (lançar `Error`).

## Estilização / CSS

- Tailwind utilitário; compor classes condicionais com `cn()` (`clsx` + `tailwind-merge`),
  variantes com `class-variance-authority`. Sem CSS inline arbitrário.
- Sem `!important` (ver [`../_shared/sonar-frontend.md`](../_shared/sonar-frontend.md)).
- Tokens e escala de design vêm do design system ([`design-system.md`](design-system.md) +
  [`design-tokens.json`](../_shared/design-tokens.json)) — não inventar cor/spacing fora dos tokens.
- Acessibilidade: usar primitivos Radix; validar com Storybook `addon-a11y`.
  Ver [`../_shared/design-principles.md`](../_shared/design-principles.md).

## Logging

- `no-console` — permitido **apenas** `console.warn` e `console.error`. Sem `console.log`.
- Log de servidor (route handler) segue níveis de [`_shared/logging-and-levels.md`](../../_shared/logging-and-levels.md);
  nunca logar token, chave PEM, PIN block, CPF/CNPJ sem máscara, payload de login.

## Tratamento de erro

- Erros de domínio como classes em `src/errors/` (`app-error`, `bad-request-error`,
  `unauthorized-error`, `forbidden-error`, `not-found-error`); `parser.ts` normaliza erro do
  gateway. Route handler devolve status semântico + corpo modelado (ver
  [`_shared/api-standards.md`](../../_shared/api-standards.md)), sem stack do upstream.
- Erro do gateway em Problem Details ([`_shared/api-standards.md`](../../_shared/api-standards.md) §3):
  o `parser.ts` normaliza `application/problem+json` no tipo `ProblemDetails`; resposta que não é
  Problem Details (borda, rede) vira erro genérico por `status`, sem repassar o corpo.

```ts
type ProblemDetails = {
  type: string; // URN da categoria: urn:<sistema>:erro:<categoria>
  title: string;
  status: number;
  detail: string;
  traceId: string;
  codigoRegra?: string; // RN-XXX-NN, só em regra de negócio
  dadosApoio?: Record<string, unknown>;
  errors?: { field: string; message: string; code?: string }[]; // só no 400 de validação
};
```

- O texto da UI é resolvido nesta ordem: (1) catálogo de mensagens indexado por `codigoRegra`;
  (2) sem entrada, catálogo por categoria (`type`, ou `status` se o `type` não for conhecido);
  (3) sem catálogo, o `detail` (escrito para exibição pela API). `dadosApoio` só preenche valores de
  apoio do texto do catálogo, pelas chaves documentadas pela API; extensão desconhecida não é lida.
  Nunca se exibe stack nem o corpo cru; o `traceId` fica visível nos erros inesperados.
- Erro de campo (`errors[]`) mostra o `message` junto do campo; `code`, quando a API o enviar, é o
  que o código compara (nunca regex no `message`).
- O schema Zod do formulário valida os **mesmos limites** que a API impõe (tamanho máximo de cada
  texto, inclusive por item de lista), lidos do contrato. Quando o `400` de validação marca todos os
  campos com erro, o topo do formulário **não repete** mensagem genérica; ela só aparece se houver
  erro que não cabe em campo visível.
- Lista paginada vem no modelo **plano** `{ content, page, size, totalElements, totalPages }` (`page`
  0-based) ou `content` + `nextCursor`; o schema Zod da resposta reflete esse formato. A edição
  devolve no corpo a `versao` lida (`409` de categoria `conflito-versao` → pedir para recarregar), e o
  POST que exige `Idempotency-Key` gera a chave uma vez por intenção do usuário e a reutiliza no
  reenvio.
- **Operação assíncrona** (`POST` que responde `202` e `GET` do estado,
  [`_shared/operations-and-readiness.md`](../../_shared/operations-and-readiness.md) §7): a ação
  irreversível pede **confirmação explícita** (o texto diz que não se desfaz e que pode demorar), o
  envio leva `Idempotency-Key` gerada uma vez por intenção, e a tela mostra o estado e o acompanha
  por **consulta periódica só enquanto houver execução em andamento**; erro de regra ou de
  permissão interrompe a consulta (falha técnica segue tentando) e nada do estado fica em cache
  depois da tela. O `409` de regra "já em andamento" mostra a mensagem do catálogo e passa a
  acompanhar a execução existente; o botão fica desabilitado, com o motivo, enquanto executa.
- UI usa `react-error-boundary` para falha de render; diálogos de erro via providers dedicados.

## Comentários

Só o **porquê** não óbvio (o `eslint.config.mjs` e o `next.config.mjs` do sistema são bom
exemplo). `removeComments` no build.

## Proibido silenciar análise

Sem `// eslint-disable` sem justificativa, sem `@ts-ignore` sem descrição, sem `any` para
"fazer passar". Corrigir estruturalmente.

## Checklist

- [ ] Checklist de [`../_shared/typescript-and-imports.md`](../_shared/typescript-and-imports.md) cumprido
- [ ] `type` em vez de `interface`
- [ ] `'use client'` só nas folhas; contexto memoizado
- [ ] Imports na ordem do `import-helpers` (grupo `next` após `react`); alias `@/`
- [ ] Arquivos kebab-case; componentes PascalCase; hooks `use-*`
- [ ] `cn()`/`cva` para classes; sem `!important`; cores/spacing via tokens
- [ ] Só `console.warn`/`console.error`; nada sensível em log
- [ ] Erros via `src/errors/*`; handler devolve status semântico modelado; texto de erro: catálogo por `codigoRegra` → categoria (`type`/`status`) → `detail`, nunca stack nem corpo cru
- [ ] Página no modelo plano `{ content, page, size, totalElements, totalPages }`; `versao` devolvida na edição
- [ ] Formulário valida os limites de tamanho da API; `400` com todos os campos marcados sem mensagem genérica repetida no topo
- [ ] Nenhuma supressão de lint/TS sem justificativa
