# Design System — Frontend React (Banestes)

> Materializa [`../_shared/design-principles.md`](../_shared/design-principles.md) para
> React SPA + Radix + Tailwind 4. É o **mesmo design system** das demais stacks de frontend:
> tokens, tipografia, dimensões, iconografia, tema, acessibilidade e API dos primitivos estão em
> [`../_shared/design-system-common.md`](../_shared/design-system-common.md) e valem
> integralmente. Este documento cobre só o que é do React + Vite + Tailwind 4.
> **Valores:** [`../_shared/design-tokens.json`](../_shared/design-tokens.json) (fonte única).
> **Tailwind 4 (escala de espaçamento, `dark:`, `--text-*--line-height`):**
> [`../_shared/tailwind-4-tokens.md`](../_shared/tailwind-4-tokens.md).
> **Código dos primitivos:** [`components/`](components/) desta coleção (semente).

## Stack visual

React 19 · Vite 8 · Tailwind CSS 4 (`@tailwindcss/vite`) · Radix UI · CVA · `tailwind-merge` ·
`tw-animate-css` · shadcn/ui (*new-york*, *zinc*, CSS variables) · `@phosphor-icons/react`.
Tema claro (default) e escuro via classe `.dark`. Catálogo: Storybook 10
(`@storybook/react-vite`).

## Tokens no Tailwind 4

Tailwind 4 é configurado em CSS. O `src/styles.css` declara as CSS custom properties de
`design-tokens.json` em `:root`/`.dark` e as expõe com `@theme inline`. As classes resultantes
são as mesmas das demais stacks (`bg-primary`, `rounded-xl`, `p-4xl`). Valores sempre copiados
de `design-tokens.json`, nunca digitados de memória.

Esqueleto (as regras e o porquê de cada ponto estão em
[`tailwind-4-tokens.md`](../_shared/tailwind-4-tokens.md)):

```css
@import 'tailwindcss';
@import 'tw-animate-css';

@custom-variant dark (&:where(.dark, .dark *));

:root {
  --background: #ffffff;
  --primary: #004b8d;
  --primary-foreground: #ffffff;
  /* … demais papéis claros de design-tokens.json */
  --radius: 1rem;

  /* Escala nomeada: em :root, nunca em @theme como --spacing-*. --spacing não se redefine. */
  --space-base: 1rem;
  --space-lg: calc(var(--space-base) - 4px);
  --space-4xl: calc(var(--space-base) + 16px);
  /* … demais degraus */
}

.dark {
  --background: #0c111d;
  /* … demais papéis escuros */
}

@theme inline {
  --color-background: var(--background);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  /* … um --color-* por papel semântico */

  --font-sans: Inter, ui-sans-serif, system-ui, sans-serif;

  --text-sm: 0.875rem;
  --text-sm--line-height: 1.25rem;
  /* … degraus xs a 4xl */

  --radius-lg: calc(var(--radius) - 8px);
  /* … sm, md, xl */
}

@layer base {
  html { font-size: 16px; }
  body { background-color: var(--background); color: var(--foreground); font-family: var(--font-sans); }
}

@utility p-4xl { padding: var(--space-4xl); }
@utility px-lg { padding-inline: var(--space-lg); }
```

Diferenças do Tailwind 4 que os primitivos desta coleção já tratam (ao portar código de
Tailwind 3, rodar `npx @tailwindcss/upgrade` e revisar o diff):

- `border` sem cor usa `currentColor`: a cor da borda é sempre explícita
  (`border-secondary-border`).
- `shadow-sm` do Tailwind 3 é `shadow-xs` no 4.
- `outline-none` virou `outline-hidden` (o contorno some só fora do modo de alto contraste).
- `tailwindcss-animate` é substituído por `tw-animate-css`.

### Fonte Inter

O arquivo `.woff2` da Inter Variable (licença OFL 1.1) vem do repositório do design system
(o mesmo da fonte do `transacional-ibanking-web`) ou do release oficial da Inter, e é
**commitado** em `public/fonts/`. Não vem de CDN (a CSP do BFF é `default-src 'self'`) nem de
pacote fora de [`stack.md`](stack.md). Substitui o `next/font/local` do Next.js:

```css
@font-face {
  font-family: 'Inter';
  src: url('/fonts/InterVariable.woff2') format('woff2');
  font-weight: 100 900;
  font-style: normal;
  font-display: swap;
}
```

O itálico, se usado, ganha um segundo `@font-face` com o arquivo `-Italic`. O Vite serve
`public/` na raiz, daí o `/fonts/…`. O fallback do `--font-sans` cobre a carga.

## Primitivos desta coleção

Código em [`components/`](components/) — uma **semente**: `Button`, `Input`, `Label`, `Card*`,
`Dialog*`, `Alert*`, `Badge`, mais `cn()` em `_lib/utils.ts` e a story do botão. API idêntica à
das demais stacks (`variant`, `size`, `iconOnly` + `aria-label`, `asChild`, `isLoading` +
`loadingLabel`, `className`, `containerClass`/`inputClass`): divergência de API é defeito.

Uso:

1. Copiar `components/ui/` → `src/shared/ui/` e `components/_lib/` → `src/shared/ui/_lib/`. Os
   arquivos importam `cn` de `@/shared/ui/_lib/utils` (alias `@/*` do `tsconfig`).
2. Montar o `styles.css` conforme a seção anterior e instalar: `@radix-ui/react-dialog`,
   `@radix-ui/react-label`, `@radix-ui/react-slot`, `class-variance-authority`, `clsx`,
   `tailwind-merge`, `tw-animate-css`, `@phosphor-icons/react`.
3. Se o sistema usa o CLI do shadcn, `components.json` com `style: new-york`, `rsc: false`,
   `tailwind.config: ""`, `tailwind.css: src/styles.css`, `iconLibrary: phosphor` e
   `aliases.utils: @/shared/ui/_lib/utils`. Todo componente gerado pelo CLI traz cores cruas
   (`zinc`): trocar por tokens semânticos antes de commitar.

Diferenças em relação ao Next.js: sem `'use client'`, sem `next/*`, sem `forwardRef` (`ref` é
prop comum no React 19), `Link` de `react-router`, `<img>` com `width`, `height`,
`loading="lazy"` e `decoding="async"` no lugar de `next/image`.

O `Alert` usa `role="alert"` sempre, como no Next.js; mensagem informativa, não urgente,
passa `role="status"`. O botão `isLoading` mantém o foco (`aria-disabled`, não `disabled`) e
ignora o clique.

Os demais primitivos do inventário comum (`Select`, `Checkbox`, `Switch`, `Tabs`, `Sheet`,
`Drawer`, `Popover`, `DropdownMenu`, `Command`, `Tooltip`, `Table`, `Calendar`, `Toaster`…)
seguem o mesmo padrão e a API do inventário, e entram na semente quando estabilizados num
sistema. Bibliotecas por primitivo em [`stack.md`](stack.md) (`vaul`, `cmdk`, `sonner`,
`input-otp`, `react-day-picker`, `@tanstack/react-table`).

### Compostos de domínio

`MaskInput`, `CpfCnpjMaskInput`, `DatePicker`, `AsyncSelect`, `Stepper`, `LabelValue`,
`ErrorView` e os demais do inventário comum ainda não têm semente nesta coleção: são
construídos sobre os primitivos, com a API do inventário. Os que dependem de rota
(`BackNavigationBtn`, `LinkIconBtn`) usam `useNavigate` e `Link` do `react-router`.

> Componentes de rota (`features/**/components`) **não** fazem parte do design system — ficam
> no sistema.

## Storybook

Configuração de referência (Storybook 10, `@storybook/react-vite`). O Storybook reaproveita o
`vite.config.ts` do sistema (plugin do Tailwind, alias `@`), então as stories importam como o
app. A story fica ao lado do primitivo (`shared/ui/button.stories.tsx`).

`.storybook/main.ts`:

```ts
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  framework: '@storybook/react-vite',
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-a11y', '@storybook/addon-themes'],
  staticDirs: ['../public'], // serve /fonts/InterVariable.woff2
};

export default config;
```

`.storybook/preview.ts`:

```ts
import { withThemeByClassName } from '@storybook/addon-themes';
import type { Preview } from '@storybook/react-vite';

import '../src/styles.css';

const preview: Preview = {
  decorators: [
    withThemeByClassName({
      themes: { claro: '', escuro: 'dark' },
      defaultTheme: 'claro',
    }),
  ],
  parameters: {
    a11y: { test: 'error' },
  },
};

export default preview;
```

- O decorator alterna a classe `.dark` no `html`: o mesmo mecanismo do app.
- `a11y.test: 'error'` faz violação de acessibilidade reprovar a story (o `todo` só avisa).
- Tipos de `Meta`/`StoryObj` vêm de `@storybook/react-vite`, nunca de `@storybook/nextjs`.
- Incluir `.storybook/` no `tsconfig` e no lint.
- Story cobre as variantes, os estados (desabilitado, carregando) e os dois temas.

## Checklist

- [ ] Checklist comum de [`design-system-common.md`](../_shared/design-system-common.md) cumprido
- [ ] Primitivos de `components/` copiados; API pública idêntica à das demais stacks
- [ ] Escala nomeada em `:root` (`--space-*`) + `@utility`; nenhum `--spacing-*` no `@theme`; `--spacing` intocada
- [ ] `max-w-lg` computa 32rem e `p-4xl` existe (teste em navegador real, ver [`tailwind-4-tokens.md`](../_shared/tailwind-4-tokens.md))
- [ ] `@custom-variant dark (&:where(.dark, .dark *));` e `--text-*--line-height` declarados
- [ ] Inter Variable em `public/fonts/` com `@font-face`; nada de CDN
- [ ] Borda sempre com cor explícita; `outline-hidden`, não `outline-none`; `tw-animate-css`
- [ ] Storybook com `@storybook/react-vite`, addon a11y em `error` e seletor de tema claro/escuro
- [ ] Token novo adicionado em `design-tokens.json` antes do uso, refletido no `styles.css`
