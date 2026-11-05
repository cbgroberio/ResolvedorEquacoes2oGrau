# Arquitetura — Frontend React (SPA)

> Materializa [`_shared/architecture-principles.md`](../../_shared/architecture-principles.md)
> para SPA React com Vite e React Router em data mode. Fronteira com backend:
> [`../_shared/spa-bff.md`](../_shared/spa-bff.md).

## 1. Padrão

**Feature-first.** Cada feature de negócio é uma pasta em `src/features/`, carregada por
rota lazy, com tudo o que só ela usa dentro dela. Só sobe para `src/shared/` o que é
genuinamente compartilhado. O nome da pasta é o termo de negócio (`cadastros`, `relatorios`).

## 2. Estrutura de pastas

```text
src/
├── main.tsx                     # carrega /config.json, valida, cria root
├── app/
│   ├── providers.tsx            # QueryClientProvider, tema, toaster
│   ├── router.tsx               # createBrowserRouter: só rotas lazy das features
│   ├── layouts/                 # layout público e autenticado
│   └── error-route.tsx          # errorElement padrão (Problem Details → tela de erro)
├── features/
│   └── <feature>/
│       ├── routes.tsx           # RouteObject[] da feature (lazy)
│       ├── pages/               # componentes roteáveis: orquestram hooks e UI
│       ├── components/          # apresentação da feature
│       ├── api/                 # funções HTTP + query keys + hooks useQuery/useMutation
│       ├── hooks/               # hooks de UI da feature
│       └── model/               # types e schemas Zod
├── shared/
│   ├── ui/                      # design system (primitivos + compostos) — ver design-system.md
│   ├── hooks/                   # hooks genéricos (use-disclosure, use-debounce)
│   ├── schemas/                 # schemas Zod de domínio reutilizáveis
│   ├── <assunto>/               # domínio compartilhado que busca dado (ex.: unidade/: seletor)
│   │   ├── api/                 # funções HTTP + query keys + hooks, mocks.ts ao lado
│   │   └── model/               # types e schemas Zod do assunto
│   └── utils/                   # funções puras
├── lib/
│   ├── http/                    # instância axios, interceptors (CSRF, 401, Problem Details)
│   ├── query-client.ts          # QueryClient com defaults
│   ├── config.ts                # schema Zod + acesso tipado ao config.json
│   ├── session/                 # useSession: query do React Query sobre GET /auth/session
│   └── logger.ts                # logger (ver coding-standards.md)
└── styles.css                   # Tailwind + tokens
```

## 3. Camadas e dependência

| Camada | Papel | Não pode |
|---|---|---|
| `features/*/pages` | Compõe a tela; usa hooks de `api/` | Chamar `axios`/`fetch` direto |
| `features/*/components` | Apresentação por props | Usar React Query, Zustand ou `api/` |
| `features/*/api` | Única camada da feature que faz HTTP (via `lib/http`) | Importar de `pages`/`components` |
| `features/*/model` | Tipos e schemas | Depender de React |
| `lib/` | Infra e configuração de libs | Importar de `features/` |
| `shared/ui`, `hooks`, `utils` | Reuso transversal sem dado de servidor | Importar de `features/`; fazer HTTP |
| `shared/<assunto>/api` | Domínio compartilhado que busca dado (via `lib/http`) | Importar de `features/`, `pages` ou `components` |
| `shared/<assunto>/model` | Tipos e schemas do assunto | Importar de `features/`; depender de React |
| `app/` | Composição raiz | Conter regra de negócio |

Feature **não** importa de outra feature. O que duas features precisam sobe para `shared/`;
se busca dado (seletor de eleição, item atual no cabeçalho), vai em
`shared/<assunto>/{api,model}` — o único lugar de `shared/` autorizado a fazer HTTP. Mocks
MSW desse domínio ficam ao lado (`shared/<assunto>/api/mocks.ts`).

As regras são executadas por `no-restricted-imports` (ESLint nativo, sem plugin; razão em
[`stack.md`](stack.md)). Mínimo: feature não importa outra feature; `shared` e `lib` não
importam `features` nem `app`; HTTP (`axios`, `lib/http`) só em `features/*/api`,
`shared/*/api` e `lib`; `api` não importa `pages`/`components`; `components` não importa
React Query, Zustand nem `api/`; `model` não importa React.

```js
// eslint.config.js (trecho)
const FEATURES = ['cadastros', 'relatorios']; // uma entrada por pasta em src/features
const ban = (group, message) => ({ group, message });
const restrict = (...patterns) => ['error', { patterns }];

const noFeatures = ban(['@/features/**', '@/app/**'], 'shared e lib não importam de features nem de app.');
const noHttp = ban(['axios', '@/lib/http', '@/lib/http/**'], 'HTTP só em api/ via lib/http.');
const noUi = ban(['../pages/**', '../components/**'], 'api não importa pages nem components.');
const noPresentation = ban(['@tanstack/react-query', 'zustand', '../api/**'], 'Componente recebe dados por props.');
const noReact = ban(['react', 'react/*', 'react-dom', 'react-dom/*'], 'model não depende de React.');

export default [
  { files: ['src/shared/**/*.{ts,tsx}'], ignores: ['src/shared/**/api/**'],
    rules: { 'no-restricted-imports': restrict(noFeatures, noHttp) } },
  { files: ['src/shared/**/api/**/*.{ts,tsx}', 'src/lib/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': restrict(noFeatures) } },
  { files: ['src/shared/**/model/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': restrict(noFeatures, noHttp, noReact) } },
  ...FEATURES.flatMap((f) => {
    const dir = `src/features/${f}`;
    const noOtherFeature = ban(
      FEATURES.filter((o) => o !== f).flatMap((o) => [`@/features/${o}`, `@/features/${o}/**`]),
      'Uma feature não importa de outra.',
    );
    return [
      { files: [`${dir}/**/*.{ts,tsx}`], ignores: [`${dir}/api/**`],
        rules: { 'no-restricted-imports': restrict(noOtherFeature, noHttp) } },
      { files: [`${dir}/api/**/*.{ts,tsx}`],
        rules: { 'no-restricted-imports': restrict(noOtherFeature, noUi) } },
      { files: [`${dir}/components/**/*.{ts,tsx}`],
        rules: { 'no-restricted-imports': restrict(noOtherFeature, noHttp, noPresentation) } },
      { files: [`${dir}/model/**/*.{ts,tsx}`],
        rules: { 'no-restricted-imports': restrict(noOtherFeature, noHttp, noReact) } },
    ];
  }),
];
```

No flat config o bloco mais específico **substitui** a opção da regra, não a mescla: o que
vale para todo o projeto (ex.: lib OIDC e analytics proibidos) deve entrar em cada
`restrict(...)`. `fetch` e `XMLHttpRequest` ficam em `no-restricted-globals`.

**Regra crítica:** componente nunca chama HTTP. Todo acesso a backend passa por
`features/*/api` → `lib/http` → `/api/*` do BFF.

## 4. Dados

- **Estado de servidor:** React Query. Query keys em fábrica por feature
  (`cadastrosKeys.all`, `cadastrosKeys.detalhe(id)`); `useMutation` com invalidação
  explícita. Sem `useEffect` + fetch.
- **Loaders do router** só fazem `queryClient.ensureQueryData` — o cache continua no React Query.
- **Sessão é estado de servidor:** `lib/session/` expõe `useSession`, uma query do React
  Query sobre `GET /auth/session` (usuário e permissões). Login e logout invalidam a query;
  o `401` a limpa (ver [`security.md`](security.md) §1). Nunca copiar a sessão para o Zustand.
- **Estado global de cliente:** Zustand, um store por domínio, só para UI e preferências, com
  seletores (`useUiStore((s) => s.itemSelecionado)`). Não guardar estado de servidor no Zustand.
- **Estado local:** `useState`/`useReducer`.
- **Formulários:** `react-hook-form` + `zodResolver`; schema em `model/` ou `shared/schemas/`.
- **Configuração:** `main.tsx` busca `/config.json`, valida com Zod e só então renderiza.
  `import.meta.env` só para valor igual em todo ambiente.

## 5. Padrões táticos

- Rotas lazy por feature (`lazy: () => import('./pages/...')`); paths em constantes da
  feature, sem string solta em `<Link>`/`navigate`.
- `errorElement` por rota de feature + `react-error-boundary` para ilhas fora do router.
- Modelos de transporte: `type` com `readonly`; resposta validada com Zod em `api/`.
- React Compiler ligado: `useMemo`/`useCallback` manuais só com motivo comentado.

## 6. Protocolo para a IA

1. Feature nova = pasta em `features/<termo-de-negócio>/` com `routes`, `pages`,
   `components`, `api`, `model`.
2. Endpoint novo = função em `api/` + schema Zod em `model/` + hook React Query + teste com MSW.
3. Componente novo começa em `components/` da feature; sobe para `shared/ui` quando a
   segunda feature precisar.
4. Nunca usar `fetch`/`axios` fora de `api/` e `lib/http`.
5. Rodar `npm run lint` antes de entregar — violação de fronteira é erro.

## Checklist

- [ ] Feature em `features/<termo>/` com rota lazy; nenhuma importação entre features
- [ ] HTTP só em `api/` via `lib/http`; URL sempre `/api/*`
- [ ] Estado de servidor (inclusive a sessão) no React Query; Zustand só para UI e preferências
- [ ] Config só via `lib/config.ts`; mesmo build em todos os ambientes
- [ ] `errorElement` por rota; paths por constantes
- [ ] Fronteiras (`no-restricted-imports`) verdes; HTTP só em `features/*/api`, `shared/*/api` e `lib/http`
