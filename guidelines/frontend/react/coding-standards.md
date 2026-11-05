# Padrões de Código — Frontend React (SPA)

> Fonte da verdade executável: `eslint.config.js`, `.prettierrc`, `tsconfig.json` e
> `vite.config.ts` do sistema. Este documento resume o contrato e o que o lint não pega.
> TypeScript, ordem de imports e estilo comuns às stacks de frontend:
> [`../_shared/typescript-and-imports.md`](../_shared/typescript-and-imports.md). Este
> documento acrescenta o que é do React SPA.
> Commits: [`_shared/git-workflow.md`](../../_shared/git-workflow.md). Logs: [`_shared/logging-and-levels.md`](../../_shared/logging-and-levels.md).

## TypeScript

Base comum em [`../_shared/typescript-and-imports.md`](../_shared/typescript-and-imports.md).
Nesta coleção, além disso:

- `noUncheckedIndexedAccess` além do `strict`.
- **`type`, nunca `interface`** (`consistent-type-definitions: ['error', 'type']`).
- `import { type X }` é obrigatório (`verbatimModuleSyntax`).
- Sem `!` (non-null assertion) em código de produção.

## React

- Componente funcional; props tipadas com `type`; sem `React.FC`.
- `ref` como prop comum (React 19) — sem `forwardRef` em código novo.
- **React Compiler ligado:** não escrever `useMemo`/`useCallback`/`memo` por reflexo. Uso
  manual só com comentário explicando o motivo (ex.: identidade exigida por lib externa).
- Hooks: `rules-of-hooks` e regras do compilador (`react-hooks/*`) como erro;
  `exhaustive-deps` resolvido, nunca silenciado.
- Sem `useEffect` para derivar estado ou buscar dado — derivar no render; buscar com React Query.
- `key` estável e real em listas; índice como key proibido em lista dinâmica.
- `react-refresh/only-export-components`: arquivo de componente exporta só componentes.
- Complexidade cognitiva acima de 15 (S3776) se reduz extraindo componente ou hook **em arquivo
  próprio**, ou função pura em `lib/` — nunca componente auxiliar exportado do mesmo arquivo (fere a
  regra acima). Com o React Compiler ligado, `useMemo`/`useCallback` manuais não servem para isso.
- Acessibilidade de JSX: `jsx-a11y` em `strict`.
- `Suspense` + `lazy` para rota e bloco pesado; fallback com skeleton do design system.

## Imports e estilo

- Ordem de imports e regras de estilo em
  [`../_shared/typescript-and-imports.md`](../_shared/typescript-and-imports.md); alias `@/`
  para sair da feature, relativo só dentro dela. O [`stack.md`](stack.md) não traz plugin de
  ordenação de imports: a ordem é verificada em revisão, ou o sistema adiciona um plugin e o
  registra no `stack.md`.
- Prettier conforme [`stack.md`](stack.md); sem formatação manual.

## Nomenclatura

| Artefato | Convenção | Exemplo |
|---|---|---|
| Arquivo / pasta | kebab-case, pt_BR em termo de negócio | `pedido-card.tsx`, `meus-pedidos/` |
| Componente | PascalCase | `PedidoCard` |
| Hook | `use-` + kebab no arquivo, camelCase no símbolo | `use-pedidos.ts` → `usePedidos` |
| Hook de query de servidor | `use<Recurso>` em `lib/` ou `features/*/api` | `useSession` (query sobre `GET /auth/session`) |
| Query keys | `<feature>Keys` | `pedidoKeys.detalhe(id)` |
| Store Zustand (só UI e preferências) | `use<Dominio>Store` em `<dominio>-store.ts` | `useUiStore` |
| Schema Zod | `*.schema.ts` | `pedido.schema.ts` |
| Constante | UPPER_SNAKE_CASE | `MAX_TENTATIVAS` |

## Estilização / CSS

- Tailwind utilitário; `cn()` para classes condicionais; `cva` para variantes. Sem `style`
  inline arbitrário, sem CSS-in-JS.
- Sem `!important` (ver [`../_shared/sonar-frontend.md`](../_shared/sonar-frontend.md)).
- Cor, espaço, raio e tipografia só via tokens ([`design-system.md`](design-system.md),
  [`../_shared/design-tokens.json`](../_shared/design-tokens.json)).
- Acessibilidade conforme [`../_shared/design-principles.md`](../_shared/design-principles.md).

## Logging

- `no-console` como erro. Log passa por `lib/logger.ts`, que aplica os níveis de
  [`_shared/logging-and-levels.md`](../../_shared/logging-and-levels.md) e envia
  `warn`/`error` à observabilidade.
- Nunca logar dado de sessão, CPF/CNPJ sem máscara, número de conta completo, payload de
  formulário de credencial.

## Tratamento de erro

- O interceptor do axios converte erro HTTP `application/problem+json` em `ProblemDetails` tipado
  ([`_shared/api-standards.md`](../../_shared/api-standards.md) §3); hooks de `api/` expõem esse
  tipo. Resposta que não é Problem Details (borda, rede) vira erro genérico por `status`.

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

- O texto da tela é resolvido nesta ordem: (1) catálogo de mensagens da SPA indexado por
  `codigoRegra`; (2) sem entrada, catálogo por categoria (`type`, ou `status` se o `type` não for
  conhecido); (3) sem catálogo, o `detail` (escrito para exibição pela API). `dadosApoio` só preenche
  valores de apoio do texto do catálogo (limite, intervalo), pelas chaves documentadas pela API;
  extensão desconhecida não é lida. Nunca se exibe stack, `title` cru nem o corpo da resposta.
- Erro de campo (`errors[]`) mostra o `message` junto do campo; `code`, quando a API o enviar, é o
  que o código compara (nunca regex no `message`). O `traceId` fica visível para suporte nos erros
  inesperados. Exemplo: `codigoRegra` `RN-PED-03` com `dadosApoio.limite` mostra o texto do catálogo
  para `RN-PED-03` com o limite interpolado.
- O schema Zod do formulário valida os **mesmos limites** que a API impõe (tamanho máximo de cada
  texto, inclusive por item de lista), lidos do contrato: o usuário vê o erro no campo antes do
  envio, e não um `400` depois. Quando o `400` de validação marca todos os campos com erro, o topo
  do formulário **não repete** mensagem genérica ("verifique os campos"); ela só aparece se houver
  erro que não cabe em campo visível.
- Página de listagem ou de `POST /<recurso>/consultas` segue o modelo **plano**
  `type Pagina<T> = { content: T[]; page: number; size: number; totalElements: number; totalPages: number }`
  (`page` 0-based); o schema Zod da resposta reflete esse formato. A edição devolve no corpo a `versao`
  lida (`409` de categoria `conflito-versao` → pedir para recarregar), e o POST que exige
  `Idempotency-Key` gera a chave uma vez por intenção do usuário e a reutiliza no reenvio.
- **Operação assíncrona** (`POST` que responde `202` e `GET` do estado,
  [`_shared/operations-and-readiness.md`](../../_shared/operations-and-readiness.md) §7): a ação
  irreversível pede **confirmação explícita** (o texto diz que não se desfaz e que pode demorar), o
  envio leva `Idempotency-Key` gerada uma vez por intenção, e a tela mostra o estado e o acompanha
  por **consulta periódica só enquanto houver execução em andamento** (o `refetchInterval` do React
  Query é função do estado, falso fora disso); erro de regra ou de permissão interrompe a consulta
  (falha técnica segue tentando) e nada do estado fica em cache depois da tela. O `409` de regra "já em andamento" mostra a mensagem do catálogo e passa a
  acompanhar a execução existente; o botão fica desabilitado, com o motivo, enquanto executa.
- `401` e `403` seguem [`security.md`](security.md), fora do catálogo de regras.
- Tela trata `isPending`, vazio, `isError` e sucesso.
- Erro de render cai no `errorElement` da rota ou em `react-error-boundary`.

## Comentários

Só o **porquê** não óbvio. Sem código comentado.

## Proibido silenciar análise

Sem `// eslint-disable` sem justificativa na mesma linha, sem `@ts-ignore` (usar
`@ts-expect-error` com descrição), sem `any`, sem `"use no memo"` sem DR. Corrigir
estruturalmente.

## Checklist

- [ ] Checklist de [`../_shared/typescript-and-imports.md`](../_shared/typescript-and-imports.md) cumprido
- [ ] Sem `!`; `type` em vez de `interface`
- [ ] Sem `forwardRef`; sem `useMemo`/`useCallback` sem motivo comentado
- [ ] Nenhum `useEffect` para derivar estado ou buscar dado
- [ ] Regras de hooks, do compilador e `jsx-a11y` sem violação
- [ ] Nomes conforme a tabela; arquivos kebab-case
- [ ] `cn()`/`cva`; sem `!important`; só tokens
- [ ] Log só via `lib/logger.ts`; nada sensível
- [ ] Texto de erro da tela: catálogo por `codigoRegra` → categoria (`type`/`status`) → `detail`; erro de campo mostra o `message` junto do campo; nunca stack nem corpo cru
- [ ] Página no modelo plano `{ content, page, size, totalElements, totalPages }`; `versao` devolvida na edição
- [ ] Formulário valida os limites de tamanho da API; `400` com todos os campos marcados sem mensagem genérica repetida no topo
- [ ] Nenhuma supressão de lint/TS sem justificativa
