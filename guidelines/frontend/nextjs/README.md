# Guidelines — Frontend Next.js

Stack: **Next.js 16 (App Router / RSC) + React 19 + TypeScript 6 + Node 24**.
Extraídas de `systems/transacional-ibanking-web` (Internet Banking transacional).

| Arquivo | Conteúdo |
|---|---|
| [`stack.md`](stack.md) | Runtime, framework, UI, estado/dados, segurança, qualidade, infra |
| [`architecture.md`](architecture.md) | App Router feature-first, colocation `_*`, BFF em `app/api/*`, Server vs Client (fronteira executada por teste), estado, rotas tipadas |
| [`coding-standards.md`](coding-standards.md) | TS strict, `type` vs `interface`, regras ESLint/React/Prettier, nomenclatura, estilização Tailwind, erros |
| [`testing.md`](testing.md) | Jest + Testing Library + Playwright (e2e) + Storybook a11y; convenções e protocolo |
| [`security.md`](security.md) | Fronteira cliente/servidor, BFF, sessão/JWT, feature-access, CSP/headers, sanitização |
| [`design-system.md`](design-system.md) | Design system Banestes para Next.js: tokens concretos, tipografia, dimensões, temas, ícones, mecânica `cn()`/CVA, API dos primitivos — igual p/ qualquer app Next.js Banestes |
| [`design-tokens.json`](../_shared/design-tokens.json) | Tokens legíveis por máquina, compartilhados entre as stacks de frontend (cópia; fonte = repo do design system) |
| [`components/`](components/) | Código reutilizável dos primitivos + compostos de domínio bancário |
| [`definition-of-done.md`](definition-of-done.md) | Gate de qualidade estática, testes, contrato, segurança, a11y + checklist de review |

Transversais de frontend: [`../_shared/design-principles.md`](../_shared/design-principles.md) (método de design, agnóstico de framework), [`../_shared/sonar-frontend.md`](../_shared/sonar-frontend.md) (regras Sonar web).
Transversais gerais: [`_shared/`](../../_shared/) (arquitetura, API HTTP, logging, segurança de API, libs vulneráveis, git).
Artefatos do **sistema** (não guideline): `screen-inventory.md`, componentes de rota, dívidas de design do codebase.

> Fonte da verdade executável continua sendo `eslint.config.mjs`, `tsconfig.json`,
> `.prettierrc.js`, `jest.config.js` e `next.config.mjs` do sistema. Estes docs resumem o
> contrato e o que as ferramentas não capturam.
