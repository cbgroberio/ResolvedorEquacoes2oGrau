# Arquitetura — Frontend Next.js

> Materializa [`_shared/architecture-principles.md`](../../_shared/architecture-principles.md)
> para App Router. Referência real: `systems/transacional-ibanking-web`.

## 1. Padrão

**Feature-first / colocation.** A rota é a unidade de organização: cada feature vive sob a
sua pasta em `src/app`, com tudo o que só ela usa colocado ao lado (private folders `_*`).
Só sobe para `src/` o que é genuinamente compartilhado entre features.

## 2. Estrutura de pastas

```text
src/
├── app/
│   ├── (public)/                # grupo de rotas sem sessão (login, requisitos-e-seguranca)
│   ├── (protected)/             # grupo de rotas autenticadas
│   │   ├── _components|_hooks|_providers|_schemas/   # compartilhado entre rotas protegidas
│   │   └── <feature>/           # pix, extratos, pagamentos, transferencias, ...
│   │       ├── page.tsx · layout.tsx
│   │       ├── [param]/         # rota dinâmica
│   │       └── _components|_hooks|_schemas|_providers|_utils|_types/   # privado da feature
│   ├── api/<recurso>/route.ts   # route handlers = BFF sobre o API_GATEWAY_URL
│   └── health/                  # liveness/readiness: pública, dinâmica (force-dynamic, no-store), isenta do proxy.ts (matcher e função) e de (protected), sem redirect
├── components/
│   ├── ui/                      # shadcn/Radix — primitivos de design system
│   └── <componente>/            # componentes compostos reutilizáveis + __tests__/
├── lib/                         # integração com libs externas: axios/, jwt/, redux/, react-query.ts, feature-access/, dayjs.ts, utils.ts
├── providers/<nome>-provider/   # React context providers (um por pasta: provider.tsx + index.ts + types.ts)
├── hooks/                       # hooks genéricos (use-disclosure, use-os, use-window-event, ...)
├── routes/                      # catálogo tipado de rotas: app-routes.ts, gateway-routes.ts, route-core.ts
├── schemas/                     # schemas Zod reutilizáveis de domínio (cpf-cnpj, chave-pix, valor-transacao, ...)
├── utils/{auth,crypto,formatters,helpers,validations}/   # funções puras, uma por arquivo + index.ts + __tests__/
├── config/envs.ts              # leitura e validação de variáveis de ambiente (ponto único)
├── constants/ · errors/ · types/ · assets/ · @types/
└── proxy.ts                    # middleware/entrada de proxy
```

## 3. Camadas e dependência

| Camada | Papel | Não pode |
|---|---|---|
| `app/**/page.tsx`, `layout.tsx` | Composição de tela; Server Component por padrão | conter regra de negócio complexa ou fetch cru — delega a hooks/route handlers |
| `app/**/_components` (client) | UI interativa da feature | acessar `process.env` direto (usar `config/envs.ts`), chamar o gateway direto |
| `app/api/**/route.ts` (BFF) | Única ponte para o `API_GATEWAY_URL`; adiciona auth, valida, molda resposta | expor erro/stack do upstream; devolver payload não modelado |
| `lib/` | Configuração de libs externas e clientes | importar de `app/` |
| `providers/` | Estado transversal via context | conter fetch de dados de negócio (isso é react-query) |
| `hooks/`, `utils/`, `schemas/`, `routes/` | Genéricos, puros, sem React DOM (exceto hooks) | depender de uma feature específica |

**Regra crítica (equivalente ao "entity nunca no controller"):** componentes de tela **não**
chamam o `API_GATEWAY_URL` diretamente. Todo acesso a backend passa por um route handler em
`src/app/api/*`, e o componente consome via `@tanstack/react-query` + `axios` (`src/lib/axios`).

## 4. Server vs Client Components

- **Server Component é o padrão.** `'use client'` só quando há estado, efeito, evento de
  browser ou hook de cliente.
- Marcar `'use client'` o mais fundo possível na árvore (folhas interativas), não no `layout`.
- Segredos, `jose`, cripto e leitura de env sensível **só** em Server Component / route handler.
- `NEXT_PUBLIC_*` é o único env que pode chegar ao cliente, e só com valor igual em todo ambiente
  (é gravado no build); valor por ambiente é lido no servidor e passado ao cliente.

### 4.1 Fronteira client/server executada

Equivalente às fronteiras por `no-restricted-imports` das coleções React e Angular
(`architecture.md` §3 delas): a regra é conferida por ferramenta, não só na revisão. Os testes de
componente renderizam tudo no cliente e **não** pegam a quebra da fronteira, que derruba a página
com `500` só no `next build`/`next start`.

| Regra | Como se executa |
|---|---|
| Componente que usa API de cliente declara `'use client'` na primeira linha | Teste de regressão no código-fonte (abaixo) |
| Arquivo `'use client'` não importa módulo de servidor (`config/envs`, `utils/auth`, `utils/crypto`, `lib/axios` do BFF, `jose`, `node:*`) | Mesmo teste; o `next build` também falha com `node:*` no cliente |
| Camadas da §3 (`lib` não importa `app`, `hooks`/`utils`/`schemas`/`routes` não importam feature) | `no-restricted-imports` no `eslint.config.mjs` |

**Teste de regressão** em `src/app/__tests__/fronteira-client-server.test.ts`, rodado pelo Jest:

- Percorre os `.tsx` de `src/` (fora `__tests__/`, `*.stories.tsx` e ajudantes de Storybook) e
  reprova o arquivo **sem** `'use client'` que use API de cliente: `useState`, `useEffect`,
  `useLayoutEffect`, `useReducer`, `useRef`, `useContext`, `useMemo`, `useCallback`,
  `useTransition`, `useOptimistic`, `createContext` e entradas de biblioteca que criam contexto (ex.:
  `@phosphor-icons/react`, cuja entrada para servidor é `@phosphor-icons/react/ssr`).
- Reprova o arquivo **com** `'use client'` que importe um dos módulos de servidor da tabela.
- Tem um caso que prova que o detector pega o defeito (trecho com `useState` sem `'use client'`),
  para o teste não passar vazio se o padrão quebrar.
- A lista de APIs e de módulos de servidor é atualizada quando entra hook ou módulo novo.

## 5. Dados

- **Estado de servidor:** `@tanstack/react-query` — uma `queryKey` por recurso; `useMutation`
  para escrita; invalidação explícita. Sem `useEffect` + `fetch` manual.
- **Estado de cliente global:** Redux Toolkit (slice por domínio em `lib/redux/features`),
  persistido seletivamente com `redux-persist`. Não duplicar em Redux o que é estado de servidor.
- **Estado local:** `useState`/`useReducer` no componente.
- **Formulários:** `react-hook-form` + `zodResolver`; schema em `_schemas/` (feature) ou
  `src/schemas/` (reutilizável).

## 6. Rotas tipadas

Nunca hardcode de path/URL espalhado. `src/routes/` centraliza rotas de app e do gateway;
telas e handlers importam de lá.

## 7. Organização de arquivo/pasta

- Um artefato por arquivo; pasta com `index.ts` (barrel) quando há múltiplos arquivos
  (`provider.tsx` + `types.ts` + `index.ts`).
- Nome de arquivo em **kebab-case**, em português quando for termo de negócio
  (`formatar-valor-brl.ts`, `chave-pix.schema.ts`, `use-feature-access.ts`).
- Testes em `__tests__/` colocado, arquivo `*.test.ts(x)`.
- Private folders do Next (`_components`, `_hooks`, ...) para colocation que não vira rota.

## Checklist

- [ ] Feature colocada sob `app/(protected|public)/<feature>/` com `_*` privados
- [ ] Server Component por padrão; `'use client'` só nas folhas interativas
- [ ] Fronteira client/server executada: teste `fronteira-client-server.test.ts` (API de cliente sem `'use client'` e módulo de servidor importado por `'use client'`) verde; camadas por `no-restricted-imports`
- [ ] Nenhum componente chama o gateway direto — sempre via route handler + react-query
- [ ] Env lido só em `config/envs.ts`; segredo nunca em client; só `NEXT_PUBLIC_*` no browser
- [ ] Estado de servidor no react-query, não no Redux
- [ ] Paths via `src/routes/`, não string solta
- [ ] `health/` responde sem sessão e sem `3xx`, com o `proxy.ts` ligado; é dinâmica (`force-dynamic`, `Cache-Control: no-store`, sem pré-renderização no build) e responde `503` nomeando as variáveis inválidas, sem valores ([`operations-and-readiness.md`](../../_shared/operations-and-readiness.md) §1)
- [ ] Exclusão de `/health` do login em **duas travas independentes**: no `matcher` do `proxy.ts` **e** dentro da função do proxy
- [ ] Arquivos kebab-case, um artefato por arquivo, barrel `index.ts`, testes em `__tests__/`
