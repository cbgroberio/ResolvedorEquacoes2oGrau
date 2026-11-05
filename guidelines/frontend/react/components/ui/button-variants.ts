import { cva } from 'class-variance-authority';

import { cn } from '@/shared/ui/_lib/utils';

// Mesmas variantes do Button das demais stacks de frontend (paridade visual).
// Fica fora de button.tsx para o arquivo de componente exportar só componentes
// (react-refresh/only-export-components).
const ICON_SIZE_MD = "[&_svg:not([class*='size-'])]:size-6";
const ICON_SIZE_SM = "[&_svg:not([class*='size-'])]:size-5";

export const buttonVariants = cva(
  cn(
    'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap',
    'rounded-lg font-medium transition-colors',
    // Tailwind 4: `outline-none` removeria o contorno; `outline-hidden` o mantém em alto contraste.
    'outline-hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    '[&_svg]:pointer-events-none [&_svg]:shrink-0',
    'disabled:pointer-events-none disabled:opacity-50',
    'aria-disabled:pointer-events-none aria-disabled:opacity-50',
  ),
  {
    variants: {
      variant: {
        primary: cn(
          'bg-primary text-primary-foreground',
          'hover:bg-primary-hover active:bg-primary-active',
          'focus-visible:ring-ring',
        ),
        secondary: cn(
          'border border-secondary-border bg-secondary text-secondary-foreground',
          'hover:bg-secondary-hover active:bg-secondary-active',
          'focus-visible:ring-ring',
        ),
        ghost: cn(
          'text-ghost-foreground',
          'hover:bg-ghost-hover active:bg-ghost-active',
          'focus-visible:ring-ring',
        ),
        destructive: cn(
          'border border-destructive-border bg-destructive text-destructive-foreground',
          'hover:bg-destructive-hover active:bg-destructive-active',
          'focus-visible:ring-ring-destructive',
        ),
      },
      size: {
        md: cn('h-11 px-4 text-base', ICON_SIZE_MD),
        sm: cn('h-9 px-3 text-sm', ICON_SIZE_SM),
      },
      iconOnly: {
        true: 'px-0',
      },
    },
    compoundVariants: [
      { iconOnly: true, size: 'md', class: 'w-12' },
      { iconOnly: true, size: 'sm', class: 'w-9' },
    ],
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);
