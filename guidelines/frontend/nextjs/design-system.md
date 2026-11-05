# Design System — Frontend Next.js (Banestes)

> Materializa [`../_shared/design-principles.md`](../_shared/design-principles.md) para a
> stack Next.js + Tailwind + Radix. Igual para **qualquer app web Next.js do Banestes** —
> não é específico do Internet Banking.
> **Tokens, tipografia, dimensões, iconografia, tema, acessibilidade e API dos primitivos**
> são comuns às stacks de frontend: [`../_shared/design-system-common.md`](../_shared/design-system-common.md).
> Este documento cobre só o que é do Next.js e do Tailwind 3.4.
> Extraído por engenharia reversa de `transacional-ibanking-web` em 2026-09-01.
> **Fonte de verdade dos valores:** o repo do design system (hoje: `tailwind.config.ts` +
> `src/app/globals.css` + `src/components/` do `transacional-ibanking-web`). Este documento e
> [`design-tokens.json`](../_shared/design-tokens.json) são derivados — regenerar quando o theme ou as
> CSS custom properties mudarem. `screen-inventory` e componentes de rota **não** entram aqui.

## Stack visual

Next.js 16 (App Router) · React 19 · Tailwind CSS 3.4 · Radix UI (headless) · CVA ·
`tailwind-merge` · shadcn/ui (estilo *new-york*, baseColor *zinc*, CSS variables).
Tema claro (default) e escuro via classe `.dark` (`darkMode: ['selector']`).
Catálogo vivo: Storybook 10 (`.storybook/`) com addons `a11y` e `themes`.

## Mecânica de composição (específica)

A mecânica comum (headless + CVA + `cn()` + classe componível) está em
[`design-system-common.md`](../_shared/design-system-common.md). No Next.js:

- `cn()` fica em `components/_lib/utils.ts` (no app, `@/lib/utils`).
- `'use client'` nos primitivos interativos e compostos com estado; ausente nos
  apresentacionais (`Card`, `Alert`, `Badge`, `Divider`, `LabelValue`).
- Import agregado: `import { Button, Input } from '@/components/ui'` (barrel).

## Tokens no Tailwind 3.4

Os papéis e valores estão em [`design-system-common.md`](../_shared/design-system-common.md) e
[`design-tokens.json`](../_shared/design-tokens.json). Aqui só a ligação com o Tailwind 3:

- Cores, `fontSize`, `spacing` e `borderRadius` em `tailwind.config.ts`, apontando para as
  CSS custom properties de `globals.css` (`:root` e `.dark`). A base do espaçamento é variável
  do próprio app (no `transacional-ibanking-web` ainda se chama `--spacing`; o nome canônico
  dos tokens é `--space-base`), assim como `--radius: 16px`.
- Plugin `tailwindcss-animate` fornece `animate-in`/`fade-in-*`/`zoom-in-*` e os keyframes
  `accordion-down/up`, `collapsible-down/up`.
- Fonte: Inter Variable via `next/font/local` (`src/assets/fonts/`), exposta como
  `--font-inter`.

### Dívida de tokenização

Cruas ainda em uso localizado: `border-gray-300` (borda de input), `text-gray-500/600/700`,
`bg-blue-50` (badge default), `bg-red-50`/`text-red-600` (erro), `bg-emerald-50`/`text-emerald-700`
(badge segurança). Candidatas a `info`/`success`/`input-border`/`muted-foreground` (tokens
pendentes de design). As coleções em Tailwind 4 já usam só tokens semânticos.

## Iconografia (específica)

Principal: `@phosphor-icons/react`. Dentro de alguns primitivos shadcn: `@radix-ui/react-icons`.
SVGs locais em `src/assets/icons/` (via SVGR); logos em `src/assets/logos/`
(`BanestesLogo` fg `blue`|`white`).

## Componentes

Código reutilizável em [`components/`](components/) (`ui/` = primitivos, raiz = compostos,
`_lib/utils.ts` = `cn()`). Espelho de `src/components/` sem `__tests__`. O inventário de
primitivos e compostos (nomes e API) está em
[`design-system-common.md`](../_shared/design-system-common.md).

Bibliotecas por primitivo: `Drawer` (`vaul`), `Command` (`cmdk`), `Table`
(`@tanstack/react-table`), `Calendar` (`react-day-picker`), `Toaster` (`sonner`),
`MaskInput` (`react-imask`).

> Componentes locais de rota (`src/app/**/_components/`) **não** fazem parte do design system —
> ficam no sistema. Inventário de telas: artefato do sistema (`screen-inventory.md`).

## Portar para um novo app Next.js

1. Copiar `components/ui/` + `_lib/utils.ts` (→ `@/lib/utils`).
2. Portar `tailwind.config.ts` (cores/fontSize/spacing/radius) + `globals.css` (`:root`/`.dark`).
3. Instalar deps: Radix + `class-variance-authority`, `clsx`, `tailwind-merge`,
   `tailwindcss-animate`, `@phosphor-icons/react`.
4. Copiar compostos conforme necessidade (dependem de `@tanstack/react-query`,
   `react-hook-form`, `dayjs`, `react-imask`).
5. Manter Storybook como contrato visual (portar/adicionar stories).

## Checklist

- [ ] Checklist comum de [`design-system-common.md`](../_shared/design-system-common.md) cumprido
- [ ] Token novo adicionado como par claro/escuro em `globals.css` + `tailwind.config.ts` antes do uso
- [ ] Primitivo interativo com `'use client'`; apresentacional sem
- [ ] `cn()` importado de `@/lib/utils`
