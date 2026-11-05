# Guidelines — Frontend React (SPA)

Stack: **React 19 + Vite 8 + React Router 8 + TypeScript 6.0 + Node 24**, SPA atrás de BFF.
Linha aceita: React 18.3 + Node 22, só para app existente — janela em
[`../_shared/version-policy.md`](../_shared/version-policy.md).
App com SSR/RSC/SEO usa a coleção `frontend/nextjs` (fora desta coleção; não é publicada com ela).

| Arquivo | Conteúdo |
|---|---|
| [`stack.md`](stack.md) | Runtime, framework, UI, estado/dados, segurança, qualidade, compilador, pares de tooling, contrato de scripts, infra |
| [`architecture.md`](architecture.md) | Feature-first com rotas lazy, `features`/`shared`/`lib`, React Query (inclusive a sessão) + Zustand só para UI, config de runtime |
| [`coding-standards.md`](coding-standards.md) | TS strict, React 19 + React Compiler, hooks, nomenclatura, estilização, erros |
| [`testing.md`](testing.md) | Jest + Testing Library + MSW + Playwright + Storybook a11y |
| [`security.md`](security.md) | Contrato BFF no cliente, XSRF no axios, DOMPurify, CSP, bundle |
| [`design-system.md`](design-system.md) | Mesmo design system do Next.js; como portar os primitivos para Vite + Tailwind 4 |
| [`definition-of-done.md`](definition-of-done.md) | Gate de qualidade estática, testes, contrato, segurança, a11y + checklist de review |

Transversais de frontend: [`../_shared/design-principles.md`](../_shared/design-principles.md),
[`../_shared/design-tokens.json`](../_shared/design-tokens.json),
[`../_shared/spa-bff.md`](../_shared/spa-bff.md),
[`../_shared/version-policy.md`](../_shared/version-policy.md),
[`../_shared/sonar-frontend.md`](../_shared/sonar-frontend.md).
Transversais gerais: [`_shared/`](../../_shared/) (arquitetura, API HTTP, logging, segurança de API, libs vulneráveis, git).

> Coleção revisada com o primeiro sistema React SPA (eleições internas) em 2026-10, a partir
> do `vite.config.ts`, `eslint.config.js` e `tsconfig.json` reais. Em aberto: a esteira de
> frontend ([`../../_shared/operations-and-readiness.md`](../../_shared/operations-and-readiness.md) §2.1)
> e os tokens semânticos além de `destructive` (sucesso, aviso, informação, texto secundário).
