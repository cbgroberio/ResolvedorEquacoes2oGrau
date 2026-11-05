# Padrões de Código — Frontend Angular

> Fonte da verdade executável: `eslint.config.js`, `.prettierrc`, `tsconfig.json` e
> `angular.json` do sistema. Este documento resume o contrato e o que o lint não pega.
> Commits: [`_shared/git-workflow.md`](../../_shared/git-workflow.md). Logs: [`_shared/logging-and-levels.md`](../../_shared/logging-and-levels.md).

## TypeScript

- `strict` sempre; `any` é erro (`@typescript-eslint/no-explicit-any`) — usar `unknown` + narrowing.
- **`type` para modelos de dados**; `interface` só para contrato implementado por classe.
- `readonly` em toda propriedade de modelo de transporte; arrays como `readonly T[]`.
- `import { type X }` para import só de tipo (`consistent-type-imports`).
- `catch (e: unknown)` com narrow antes do uso.
- `switch` sobre union exaustivo (`switch-exhaustiveness-check`).
- Sem `!` (non-null assertion) em código de produção — tratar o `undefined`.

## Angular

- **Standalone sempre**; `imports` explícitos no componente. Sem `NgModule`.
- `changeDetection: ChangeDetectionStrategy.OnPush` em todo componente.
- **Signal APIs:** `input()`, `input.required()`, `output()`, `model()`, `viewChild()`,
  `contentChild()`. Proibido `@Input`/`@Output`/`@ViewChild` em código novo.
- **Control flow nativo:** `@if`, `@for (...; track item.id)`, `@switch`, `@defer`. Proibido
  `*ngIf`/`*ngFor`/`ngSwitch`. `track $index` só para lista estática.
- `inject()` em campo; construtor sem parâmetros de DI.
- Template sem lógica: chamada de método no template só para Signal ou `computed`.
  Derivação vai para `computed()`.
- `effect()` só para sincronizar com mundo externo (DOM, storage, log). Proibido usar
  `effect` para derivar estado — usar `computed`/`linkedSignal`.
- RxJS: `subscribe` manual só com `takeUntilDestroyed()`; converter para Signal com
  `toSignal()` na borda do componente. Sem `async` pipe em código novo.
- `host` no decorator em vez de `@HostBinding`/`@HostListener`.
- `NgOptimizedImage` (`ngSrc`) para toda imagem de conteúdo.

## Nomenclatura

Segue o style guide atual do Angular (sem sufixo de tipo no nome do arquivo de componente).

| Artefato | Convenção | Exemplo |
|---|---|---|
| Arquivo / pasta | kebab-case, pt_BR em termo de negócio | `chave-pix-card.ts`, `minhas-chaves/` |
| Componente | PascalCase, sem sufixo `Component` | `ChavePixCard` em `chave-pix-card.ts` + `.html` |
| Seletor | prefixo do sistema + kebab | `app-chave-pix-card` |
| Serviço/API client | `<recurso>-api.ts` → `RecursoApi` | `chaves-pix-api.ts` → `ChavesPixApi` |
| Store | `<feature>-store.ts` → `FeatureStore` | `pix-store.ts` → `PixStore` |
| Guard / interceptor / resolver | função camelCase | `sessaoAtivaGuard`, `problemDetailsInterceptor` |
| Rotas | `<feature>.routes.ts` | `pix.routes.ts` |
| Schema Zod | `*.schema.ts` | `chave-pix.schema.ts` |
| Constante | UPPER_SNAKE_CASE | `MAX_TENTATIVAS` |
| Signal | substantivo; booleano com `is`/`has` | `saldo`, `isCarregando` |

## Estilo

- Prettier sem formatação manual; template HTML separado do `.ts` quando passa de 5 linhas.
- `eqeqeq`, `prefer-const`, `no-param-reassign`, `object-shorthand`.
- Promises: `no-floating-promises` ativo; Observable não é misturado com `async/await` no
  mesmo fluxo.

## Estilização / CSS

- Tailwind utilitário; classes condicionais com `cn()`, variantes com `cva`. Sem `style`
  inline e sem `::ng-deep`.
- `ViewEncapsulation` padrão (Emulated); `None` proibido fora de `shared/ui` com DR.
- Sem `!important` (ver [`../_shared/sonar-frontend.md`](../_shared/sonar-frontend.md)).
- Cor, espaço, raio e tipografia só via tokens ([`design-system.md`](design-system.md),
  [`../_shared/design-tokens.json`](../_shared/design-tokens.json)).
- Acessibilidade conforme [`../_shared/design-principles.md`](../_shared/design-principles.md);
  regras `@angular-eslint/template/accessibility` como erro.

## Logging

- `no-console` como erro. Log passa pelo `LoggerService` (`core/logging`), que aplica os
  níveis de [`_shared/logging-and-levels.md`](../../_shared/logging-and-levels.md) e envia
  `warn`/`error` à observabilidade.
- Nunca logar dado de sessão, CPF/CNPJ sem máscara, número de conta completo, payload de
  formulário de credencial.

## Tratamento de erro

- Interceptor converte erro HTTP `application/problem+json` em `ProblemDetails` tipado; o API
  client propaga o tipo, não o `HttpErrorResponse`
  ([`_shared/api-standards.md`](../../_shared/api-standards.md) §3). Resposta que não é Problem
  Details (borda, rede) vira erro genérico por `status`.

```ts
type ProblemDetails = {
  readonly type: string; // URN da categoria: urn:<sistema>:erro:<categoria>
  readonly title: string;
  readonly status: number;
  readonly detail: string;
  readonly traceId: string;
  readonly codigoRegra?: string; // RN-XXX-NN, só em regra de negócio
  readonly dadosApoio?: Readonly<Record<string, unknown>>;
  readonly errors?: readonly { field: string; message: string; code?: string }[]; // só no 400 de validação
};
```

- Componente trata estados explícitos (`carregando`, `vazio`, `erro`, `sucesso`). O texto ao
  usuário é resolvido nesta ordem: (1) **catálogo de mensagens** indexado por `codigoRegra`;
  (2) sem entrada, catálogo por categoria (`type`, ou `status` se o `type` não for conhecido);
  (3) sem catálogo, o `detail` (escrito para exibição pela API). `dadosApoio` só preenche valores de
  apoio do texto do catálogo, pelas chaves documentadas pela API; extensão desconhecida não é lida.
  Nunca se exibe stack nem o corpo cru.
- Erro de campo (`errors[]`) mostra o `message` junto do campo; `code`, quando a API o enviar, é o
  que o código compara (nunca regex no `message`). O `traceId` fica visível nos erros inesperados.
- O formulário (validators e schema Zod) valida os **mesmos limites** que a API impõe (tamanho
  máximo de cada texto, inclusive por item de lista), lidos do contrato: o usuário vê o erro no
  campo antes do envio, e não um `400` depois. Quando o `400` de validação marca todos os campos com
  erro, o topo do formulário **não repete** mensagem genérica; ela só aparece se houver erro que não
  cabe em campo visível.
- Lista paginada: modelo `readonly` **plano** `{ content, page, size, totalElements, totalPages }`
  (`page` 0-based) ou `content` + `nextCursor`; o schema Zod da resposta reflete esse formato. A
  edição devolve no corpo a `versao` lida (`409` de categoria `conflito-versao` → pedir para
  recarregar), e o POST que exige `Idempotency-Key` gera a chave uma vez por intenção do usuário e a
  reutiliza no reenvio.
- **Operação assíncrona** (`POST` que responde `202` e `GET` do estado,
  [`_shared/operations-and-readiness.md`](../../_shared/operations-and-readiness.md) §7): a ação
  irreversível pede **confirmação explícita** (o texto diz que não se desfaz e que pode demorar), o
  envio leva `Idempotency-Key` gerada uma vez por intenção, e a tela mostra o estado e o acompanha
  por **consulta periódica só enquanto houver execução em andamento**; erro de regra ou de
  permissão interrompe a consulta (falha técnica segue tentando) e nada do estado fica em cache
  depois da tela. O `409` de regra "já em andamento" mostra a mensagem do catálogo e passa a
  acompanhar a execução existente; o botão fica desabilitado, com o motivo, enquanto executa.
- Erro não tratado cai no `ErrorHandler` global.

## Comentários

Só o **porquê** não óbvio. Sem código comentado.

## Proibido silenciar análise

Sem `// eslint-disable` sem justificativa na mesma linha, sem `@ts-ignore` (usar
`@ts-expect-error` com descrição), sem `any` para "fazer passar", sem desligar
`strictTemplates`. Corrigir estruturalmente.

## Checklist

- [ ] Standalone + `OnPush` + `inject()`; sem `NgModule`
- [ ] `input()`/`output()`/`model()`; control flow `@if`/`@for` com `track` real
- [ ] Derivação em `computed`; `effect` só para efeito externo
- [ ] Subscribe manual com `takeUntilDestroyed`; Observable convertido com `toSignal`
- [ ] Sem `any`, sem `!`; modelos `readonly`; `switch` exaustivo
- [ ] Nomes conforme a tabela; arquivos kebab-case sem sufixo `.component`
- [ ] `cn()`/`cva`; sem `::ng-deep`, sem `!important`; só tokens
- [ ] Texto de erro: catálogo por `codigoRegra` → categoria (`type`/`status`) → `detail`; erro de campo mostra o `message` junto do campo; nunca stack nem corpo cru
- [ ] Página no modelo plano `{ content, page, size, totalElements, totalPages }`; `versao` devolvida na edição
- [ ] Formulário valida os limites de tamanho da API; `400` com todos os campos marcados sem mensagem genérica repetida no topo
- [ ] Log só via `LoggerService`; nada sensível
- [ ] Nenhuma supressão de lint/TS sem justificativa
