# Guidelines — Frontend Angular

Stack: **Angular 22 (standalone, zoneless) + TypeScript 6.0 + Node 24**, SPA atrás de BFF.
Linha aceita: Angular 21 + Node 22 — janela em [`../_shared/version-policy.md`](../_shared/version-policy.md).

| Arquivo | Conteúdo |
|---|---|
| [`stack.md`](stack.md) | Runtime, framework, UI, estado/dados, segurança, qualidade, infra |
| [`architecture.md`](architecture.md) | Feature-first com rotas lazy, `core`/`shared`/`features`, smart × presentational, SignalStore, config de runtime |
| [`coding-standards.md`](coding-standards.md) | TS strict + `strictTemplates`, Signal APIs, control flow nativo, nomenclatura, estilização, erros |
| [`testing.md`](testing.md) | Jest (`jest-preset-angular`) + Testing Library + `HttpTestingController` + Playwright + Storybook a11y |
| [`security.md`](security.md) | Contrato BFF no cliente, XSRF, sanitização, CSP com nonce, Trusted Types |
| [`design-system.md`](design-system.md) | Design system Banestes sobre CDK + Tailwind 4; equivalência com os primitivos do Next.js |
| [`components/`](components/) | Semente de primitivos (`Button`, `Input`, `Card*`, `AppDialog`) |
| [`definition-of-done.md`](definition-of-done.md) | Gate de qualidade estática, testes, contrato, segurança, a11y + checklist de review |

Transversais de frontend: [`../_shared/design-principles.md`](../_shared/design-principles.md),
[`../_shared/design-tokens.json`](../_shared/design-tokens.json),
[`../_shared/spa-bff.md`](../_shared/spa-bff.md),
[`../_shared/version-policy.md`](../_shared/version-policy.md),
[`../_shared/sonar-frontend.md`](../_shared/sonar-frontend.md).
Transversais gerais: [`_shared/`](../../_shared/) (arquitetura, API HTTP, logging, segurança de API, libs vulneráveis, git).

> Coleção escrita a partir de prática de mercado, sem sistema de referência extraído. Ao
> primeiro sistema Angular adotá-la, revisar com `/guidelines --revisar` e incorporar o que
> o `angular.json`, `eslint.config.js` e `tsconfig.json` reais decidirem.
