import { SpinnerIcon } from '@phosphor-icons/react';
import { Slot } from '@radix-ui/react-slot';
import { type VariantProps } from 'class-variance-authority';
import { type ComponentProps } from 'react';

import { cn } from '@/shared/ui/_lib/utils';
import { buttonVariants } from './button-variants';

// Ícone sem texto exige nome acessível: o tipo recusa `iconOnly` sem `aria-label`.
type IconOnlyProps =
  | { iconOnly: true; 'aria-label': string }
  | { iconOnly?: false; 'aria-label'?: string };

// `asChild` entrega o estilo ao filho (ex.: `<a>`); estado de carga só existe no `<button>`.
type CompositionProps =
  | { asChild: true; isLoading?: never; loadingLabel?: never }
  | { asChild?: false; isLoading?: boolean; loadingLabel?: string };

export type ButtonProps = Omit<ComponentProps<'button'>, 'aria-label'> &
  Pick<VariantProps<typeof buttonVariants>, 'variant' | 'size'> &
  IconOnlyProps &
  CompositionProps;

const DEFAULT_LOADING_LABEL = 'Carregando';

export function Button({
  variant,
  size,
  iconOnly,
  asChild = false,
  isLoading = false,
  loadingLabel = DEFAULT_LOADING_LABEL,
  disabled = false,
  type = 'button',
  className,
  children,
  onClick,
  ...props
}: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size, iconOnly }), className);

  if (asChild) {
    return (
      <Slot
        className={classes}
        aria-disabled={disabled || undefined}
        onClick={
          disabled
            ? (event) => {
                event.preventDefault();
              }
            : onClick
        }
        {...props}
      >
        {children}
      </Slot>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled}
      aria-disabled={isLoading || disabled || undefined}
      aria-busy={isLoading || undefined}
      onClick={
        isLoading
          ? (event) => {
              event.preventDefault();
              event.stopPropagation();
            }
          : onClick
      }
      {...props}
    >
      {isLoading ? (
        <>
          <SpinnerIcon aria-hidden="true" className="animate-spin" />
          {iconOnly ? null : loadingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}
