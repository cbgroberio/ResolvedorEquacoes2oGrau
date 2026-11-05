import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  isDevMode,
} from '@angular/core';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { phosphorSpinner } from '@ng-icons/phosphor-icons/regular';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../_lib/cn';

const ICON_SIZE_MD = "[&_svg:not([class*='size-'])]:size-6";
const ICON_SIZE_SM = "[&_svg:not([class*='size-'])]:size-5";

// Mesmas variantes do Button das demais stacks de frontend: paridade visual entre stacks.
export const buttonVariants = cva(
  cn(
    'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap',
    'rounded-lg font-medium transition-colors',
    'outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    '[&_svg]:shrink-0 [&_svg]:pointer-events-none',
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
      size: 'sm',
      iconOnly: false,
    },
  },
);

type ButtonVariants = VariantProps<typeof buttonVariants>;

/**
 * Seletor de atributo sobre o elemento nativo: o host continua sendo `<button>`
 * ou `<a>`, com semântica e teclado nativos — equivale ao `asChild` do Next.js.
 *
 * Uso: `<button appButton variant="secondary" type="submit">Salvar</button>`.
 */
@Component({
  selector: 'button[appButton], a[appButton]',
  imports: [NgIcon],
  viewProviders: [provideIcons({ phosphorSpinner })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'classes()',
    '[attr.disabled]': 'isNativeButton && disabled() ? "" : null',
    '[attr.aria-disabled]': 'isLoading() || disabled() || null',
    '[attr.aria-busy]': 'isLoading() || null',
    '(click)': 'blockWhenInactive($event)',
  },
  template: `
    @if (isLoading()) {
      <ng-icon name="phosphorSpinner" aria-hidden="true" class="animate-spin" />
      @if (!iconOnly()) {
        {{ loadingLabel() }}
      }
    } @else {
      <ng-content />
    }
  `,
})
export class Button {
  readonly variant = input<ButtonVariants['variant']>('primary');
  readonly size = input<ButtonVariants['size']>('md');
  readonly iconOnly = input(false, { transform: booleanAttribute });
  readonly isLoading = input(false, { transform: booleanAttribute });
  readonly loadingLabel = input('Carregando');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly userClass = input('', { alias: 'class' });

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly isNativeButton = this.host.nativeElement.tagName === 'BUTTON';

  protected readonly classes = computed(() =>
    cn(
      buttonVariants({ variant: this.variant(), size: this.size(), iconOnly: this.iconOnly() }),
      this.userClass(),
    ),
  );

  constructor() {
    // O tipo não obriga `aria-label` em template Angular; a checagem fica em dev
    // para que botão só com ícone nunca chegue sem nome acessível.
    afterNextRender(() => {
      if (isDevMode() && this.iconOnly() && !this.host.nativeElement.getAttribute('aria-label')) {
        throw new Error('appButton com iconOnly exige aria-label.');
      }
    });
  }

  protected blockWhenInactive(event: Event): void {
    if (this.isLoading() || this.disabled()) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }
}
