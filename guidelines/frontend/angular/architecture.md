# Arquitetura — Frontend Angular

> Materializa [`_shared/architecture-principles.md`](../../_shared/architecture-principles.md)
> para SPA Angular standalone e zoneless. Fronteira com backend:
> [`../_shared/spa-bff.md`](../_shared/spa-bff.md).

## 1. Padrão

**Feature-first.** Cada feature de negócio é uma pasta sob `features/`, carregada por rota
lazy, com tudo o que só ela usa dentro dela. Só sobe para `core/` ou `shared/` o que é
genuinamente transversal. O nome da pasta é o termo de negócio (`pix`, `extratos`,
`pagamentos`), nunca o tipo técnico.

## 2. Estrutura de pastas

```text
src/
├── main.ts                      # bootstrapApplication + carga do config.json antes do bootstrap
├── app/
│   ├── app.ts · app.html        # shell (layout raiz)
│   ├── app.config.ts            # providers globais (router, http, zoneless, locale, ErrorHandler)
│   ├── app.routes.ts            # rotas raiz: só loadChildren/loadComponent
│   ├── core/                    # singletons da aplicação — importado só por app.config e features
│   │   ├── config/              # APP_CONFIG (InjectionToken) + schema Zod do config.json
│   │   ├── http/                # interceptors funcionais (erro, 401, correlação)
│   │   ├── auth/                # sessão via /auth/session, guards funcionais (UX)
│   │   ├── error/               # ErrorHandler global + modelo Problem Details
│   │   └── logging/             # LoggerService
│   ├── shared/
│   │   ├── ui/                  # design system (primitivos + compostos) — ver design-system.md
│   │   ├── pipes/ · directives/ # genéricos, sem regra de negócio
│   │   ├── schemas/             # schemas Zod de domínio reutilizáveis (cpf-cnpj, valor)
│   │   └── utils/               # funções puras
│   └── features/
│       └── <feature>/
│           ├── <feature>.routes.ts
│           ├── pages/           # componentes roteáveis (smart): orquestram store e UI
│           ├── components/      # componentes de apresentação (dumb) da feature
│           ├── data-access/     # <recurso>-api.ts (HttpClient) + <feature>-store.ts (SignalStore)
│           └── models/          # types e schemas Zod da feature
├── styles.css                   # Tailwind + tokens (CSS custom properties)
└── assets/
public/                          # estáticos copiados sem hash
```

## 3. Camadas e dependência

| Camada | Papel | Não pode |
|---|---|---|
| `features/*/pages` | Compõe a tela; injeta store; repassa dados por `input()` | Chamar `HttpClient`; conter regra de negócio que não seja orquestração |
| `features/*/components` | Apresentação; recebe `input()`, emite `output()` | Injetar store, `HttpClient` ou serviço de feature |
| `features/*/data-access` | API client (único que usa `HttpClient`) e SignalStore | Importar de `pages`/`components`; manipular DOM |
| `features/*/models` | Tipos e schemas | Depender de Angular |
| `core/` | Infra singleton | Importar de `features/` |
| `shared/` | Reuso transversal | Importar de `features/` ou `core/` (exceto `shared/ui` usar `core/logging`) |

Feature **não** importa de outra feature. O que duas features precisam sobe para `shared/`
ou vira contrato em `core/`. As regras são executadas por `no-restricted-imports` (ESLint
nativo, sem plugin; razão em [`stack.md`](stack.md)). Mínimo: feature não importa outra
feature; `core` e `shared` não importam `features`; `shared` não importa `core` (exceto
`core/logging`); `HttpClient` só em `data-access`; `data-access` não importa
`pages`/`components`; `components` não importa store nem `data-access`; `models` não importa
Angular.

```js
// eslint.config.js (trecho)
const FEATURES = ['cadastros', 'relatorios']; // uma entrada por pasta em src/app/features
const ban = (group, message) => ({ group, message });
const restrict = (...patterns) => ['error', { patterns }];

const noFeatures = ban(['@app/features/**'], 'core e shared não importam de features.');
const noCore = ban(['@app/core/**', '!@app/core/logging', '!@app/core/logging/**'], 'shared não importa de core (exceto logging).');
const noHttp = ban(['@angular/common/http'], 'HttpClient só em data-access.');
const noUi = ban(['../pages/**', '../components/**'], 'data-access não importa pages nem components.');
const noStore = ban(['@ngrx/signals', '../data-access/**'], 'Componente de apresentação recebe dados por input().');
const noAngular = ban(['@angular/**'], 'models não dependem de Angular.');

export default [
  { files: ['src/app/core/**/*.ts'], rules: { 'no-restricted-imports': restrict(noFeatures) } },
  { files: ['src/app/shared/**/*.ts'],
    rules: { 'no-restricted-imports': restrict(noFeatures, noCore, noHttp) } },
  ...FEATURES.flatMap((f) => {
    const dir = `src/app/features/${f}`;
    const noOtherFeature = ban(
      FEATURES.filter((o) => o !== f).flatMap((o) => [`@app/features/${o}`, `@app/features/${o}/**`]),
      'Uma feature não importa de outra.',
    );
    return [
      { files: [`${dir}/**/*.ts`], ignores: [`${dir}/data-access/**`],
        rules: { 'no-restricted-imports': restrict(noOtherFeature, noHttp) } },
      { files: [`${dir}/data-access/**/*.ts`],
        rules: { 'no-restricted-imports': restrict(noOtherFeature, noUi) } },
      { files: [`${dir}/components/**/*.ts`],
        rules: { 'no-restricted-imports': restrict(noOtherFeature, noHttp, noStore) } },
      { files: [`${dir}/models/**/*.ts`],
        rules: { 'no-restricted-imports': restrict(noOtherFeature, noHttp, noAngular) } },
    ];
  }),
];
```

No flat config o bloco mais específico **substitui** a opção da regra, não a mescla: o que
vale para todo o projeto (ex.: lib OIDC e analytics proibidos) deve entrar em cada
`restrict(...)`.

**Regra crítica:** componente nunca chama API. Todo acesso a backend passa por
`data-access/<recurso>-api.ts`, que fala apenas com `/api/*` do BFF.

## 4. Padrões táticos

- **DI por `inject()`** em campo; construtor sem parâmetros. `providedIn: 'root'` só para
  serviço realmente global; serviço de feature é provido no `providers` da rota.
- **Change detection:** zoneless em toda a app; todo componente com
  `changeDetection: ChangeDetectionStrategy.OnPush`.
- **Smart × presentational:** só `pages/` conhece store; `components/` é puro por `input()`/`output()`.
- **Estado:** Signal local → SignalStore da feature → SignalStore global em `core/`. Não
  duplicar estado de servidor em store global; ler com `rxResource`/`httpResource` ou métodos
  do store que chamam o API client. A **sessão** é estado de servidor: serviço de raiz em
  `core/auth` com `httpResource` sobre `GET /auth/session`, recarregado no login e descartado
  no `401` ([`security.md`](security.md) §1) — não é SignalStore global.
- **Configuração tipada:** `main.ts` busca `/config.json`, valida com Zod e provê
  `APP_CONFIG`. Ninguém lê `window`/`environment.ts` para valor que muda por ambiente.
- **Erro:** `ErrorHandler` global loga e exibe feedback genérico; interceptor converte
  resposta HTTP em `ProblemDetails` tipado ([`_shared/api-standards.md`](../../_shared/api-standards.md) §3).
- **Rotas:** `app.routes.ts` só com `loadChildren`; cada feature declara `<feature>.routes.ts`
  com `loadComponent`. Paths centralizados em constantes da feature — sem string solta em
  `routerLink`/`navigate`.
- **Modelos de transporte imutáveis:** `type` com `readonly`; nada de classe para DTO.

## 5. Protocolo para a IA

1. Feature nova = pasta em `features/<termo-de-negócio>/` com `routes`, `pages`,
   `components`, `data-access`, `models`.
2. Endpoint novo = método no `<recurso>-api.ts` + schema Zod em `models/` + teste.
3. Componente novo começa em `components/` da feature; só sobe para `shared/ui` quando a
   segunda feature precisar.
4. Nunca criar `NgModule`, nunca importar `zone.js`, nunca usar `HttpClient` fora de `data-access`.
5. Rodar `ng lint` antes de entregar — violação de fronteira é erro, não aviso.

## Checklist

- [ ] Feature em `features/<termo>/` com rota lazy; nenhuma importação entre features
- [ ] `HttpClient` só em `data-access`; URL sempre `/api/*`
- [ ] Componente com `OnPush`, `inject()`, `input()`/`output()`; presentational sem store
- [ ] Estado de servidor (inclusive a sessão) fora do store global; config só via `APP_CONFIG`
- [ ] Erro HTTP convertido em `ProblemDetails`; `ErrorHandler` global ativo
- [ ] Sem `NgModule`, sem `zone.js`; fronteiras (`no-restricted-imports`) verdes
