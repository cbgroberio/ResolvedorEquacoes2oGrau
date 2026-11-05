# Design System — Frontend Angular (Banestes)

> Materializa [`../_shared/design-principles.md`](../_shared/design-principles.md) para
> Angular + CDK + Tailwind 4. Mesma linguagem visual das demais stacks de frontend
> ([`../_shared/design-system-common.md`](../_shared/design-system-common.md)): tokens, escala
> tipográfica, dimensões de controle, iconografia, tema, acessibilidade e API dos primitivos
> são **idênticos** — este documento descreve só o que muda na mecânica.
> **Valores:** [`../_shared/design-tokens.json`](../_shared/design-tokens.json) (fonte única).
> **Tailwind 4 (escala de espaçamento, `dark:`, `--text-*--line-height`):**
> [`../_shared/tailwind-4-tokens.md`](../_shared/tailwind-4-tokens.md).

## Stack visual

Angular 22 standalone · `@angular/cdk` (headless) · Tailwind CSS 4 · CVA · `tailwind-merge` ·
Phosphor via `@ng-icons`. Tema claro (default) e escuro via classe `.dark` na raiz.
Catálogo vivo: Storybook 10 (`@storybook/angular`) com addons `a11y` e `themes`.

## Tokens no Tailwind 4

Tailwind 4 é configurado em CSS (`@theme`), não em `tailwind.config.ts`. O `styles.css` do
sistema declara as CSS custom properties de `design-tokens.json` e as expõe ao Tailwind
(regras e porquês em [`tailwind-4-tokens.md`](../_shared/tailwind-4-tokens.md)):

```css
@import 'tailwindcss';
@custom-variant dark (&:where(.dark, .dark *));

:root {
  --primary: #004b8d; --primary-foreground: #ffffff; /* … demais papéis light */
  /* Escala nomeada: em :root, nunca em @theme como --spacing-*. --spacing não se redefine. */
  --space-base: 1rem;
  --space-4xl: calc(var(--space-base) + 16px); /* … demais degraus */
}
.dark { --primary: #004b8d; /* … demais papéis dark, conforme design-tokens.json */ }

@theme inline {
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  /* … um --color-* por papel semântico */
  --text-sm: 0.875rem;
  --text-sm--line-height: 1.25rem; /* … degraus xs a 4xl */
  --radius-lg: calc(var(--radius) - 8px); /* … sm, md, xl */
}

@utility p-4xl { padding: var(--space-4xl); } /* uma @utility por token e propriedade usados */
```

Resultado: as mesmas classes das demais stacks (`bg-primary`, `text-secondary-foreground`,
`ring-ring`, `rounded-xl`, `p-4xl`) valem no Angular. `--spacing-*` no `@theme` quebraria
`max-w-lg` (viraria 0,75rem): por isso a escala nomeada fica em `:root` com `@utility`.
Valores sempre copiados de `design-tokens.json` — nunca digitados de memória. Tipografia:
Inter Variable servida de `public/fonts/` com `@font-face`, escala e pesos do token.

## Mecânica de composição

| React (Next.js e SPA) | Angular |
|---|---|
| Componente com `forwardRef` | Componente/diretiva standalone com `OnPush` |
| `asChild` + `Slot` (Radix) | **Seletor de atributo** sobre o elemento nativo (`button[appButton]`, `a[appButton]`) |
| `className` | Input `class` (alias) mesclado por `cn()` no binding `[class]` do `host` |
| `containerClass` / `inputClass` | Inputs homônimos |
| `cva(...)` | Mesmo `cva(...)` — variantes iguais às do React |
| `'use client'` | Não se aplica |
| Barrel `@/components/ui` | Barrel `@app/shared/ui` |

Regras:

- Comportamento vem do CDK; aparência vem de classes Tailwind via CVA.
- Toda API pública aceita `class` e resolve conflito com `tailwind-merge`.
- Primitivo só visual é diretiva de atributo (`appCard*`): o consumidor escolhe o elemento semântico.
- Nomes de componentes, variantes e tamanhos iguais aos das demais stacks (`variant`: primary,
  secondary, ghost, destructive; `size`: md, sm).

## Equivalência de primitivos

| Primitivo | React | Angular |
|---|---|---|
| Dialog / Sheet | `@radix-ui/react-dialog` | `@angular/cdk/dialog` (`AppDialog`) + posição por `panelClass` |
| Popover / Tooltip | `@radix-ui/react-popover` / `tooltip` | `@angular/cdk/overlay` (`CdkConnectedOverlay`) |
| DropdownMenu | `@radix-ui/react-dropdown-menu` | `@angular/cdk/menu` (`cdkMenuTriggerFor`, `cdkMenu`, `cdkMenuItem`) |
| Select / Combobox | Radix Select / `cmdk` | `@angular/cdk/listbox` + overlay |
| Accordion / Collapsible | Radix | `@angular/cdk/accordion` |
| Tabs | Radix Tabs | Componente próprio com padrão WAI-ARIA Tabs + `FocusKeyManager` (`@angular/cdk/a11y`) |
| Foco preso / anúncio | Radix interno | `cdkTrapFocus`, `LiveAnnouncer` |
| Table | `@tanstack/react-table` | `@angular/cdk/table` |
| Toast | `sonner` | Componente próprio sobre `cdk/overlay` + `LiveAnnouncer` |
| Calendar / DatePicker | `react-day-picker` | Componente próprio com `dayjs` (locale pt-br) |
| Máscara | `react-imask` | `imask` em diretiva |

## Dimensões, iconografia, tema e acessibilidade

Idênticos a [`../_shared/design-system-common.md`](../_shared/design-system-common.md) (seções
"Dimensões de controle", "Iconografia", "Tema claro / escuro", "Acessibilidade"), com estas
traduções:

- Ícone: `<ng-icon name="phosphorX" size="20" />`, registrado com `provideIcons` no
  componente que usa.
- Botão só com ícone: `[iconOnly]="true"` + `aria-label` — o `Button` falha em dev sem rótulo.
- Diálogo: `AppDialog.open` exige `ariaLabel` no tipo.
- Storybook alterna tema com `withThemeByClassName`.

## Componentes

Código de referência em [`components/`](components/) (`ui/` = primitivos, `_lib/cn.ts` =
`cn()`). É uma **semente**: `Button`, `Input` (ControlValueAccessor), `Card*` e
`AppDialog`/`DialogLayout`. Os demais primitivos da tabela acima são construídos seguindo o
mesmo padrão e a API do inventário comum
([`design-system-common.md`](../_shared/design-system-common.md)), e entram aqui quando
estabilizados em um sistema.

> Componentes de rota (`features/**/components`) **não** fazem parte do design system — ficam
> no sistema.

## Portar para um novo app Angular

1. Copiar `components/ui/` → `src/app/shared/ui/` e `_lib/cn.ts` → `src/app/shared/ui/_lib/`.
2. Montar `styles.css` com os tokens de `design-tokens.json` (seção "Tokens no Tailwind 4").
3. Instalar: `@angular/cdk`, `tailwindcss`, `@tailwindcss/postcss`, `class-variance-authority`,
   `clsx`, `tailwind-merge`, `@ng-icons/core`, `@ng-icons/phosphor-icons`.
4. Configurar Storybook com stories cobrindo variantes e os dois temas.

## Checklist

- [ ] Checklist comum de [`design-system-common.md`](../_shared/design-system-common.md) cumprido
- [ ] Superfície/texto só com token semântico — sem hex, sem `brand.*`/`grayDark.*`
- [ ] Componente novo = CDK + CVA + `cn()` + input `class` componível
- [ ] Variantes, tamanhos e nomes iguais aos das demais stacks
- [ ] Funciona em claro e escuro; story cobrindo variantes e 2 temas
- [ ] Ícone sem texto ⇒ `iconOnly` + `aria-label`; diálogo com `ariaLabel`
- [ ] Escala nomeada em `:root` (`--space-*`) + `@utility`; nenhum `--spacing-*` no `@theme`; `--spacing` intocada
- [ ] `max-w-lg` computa 32rem e `p-4xl` existe (teste em navegador real, ver [`tailwind-4-tokens.md`](../_shared/tailwind-4-tokens.md))
- [ ] Token novo adicionado em `design-tokens.json` antes do uso, refletido no `styles.css`
