import { Spinner } from '@phosphor-icons/react';
import { Slot } from '@radix-ui/react-slot';
import { type VariantProps } from 'class-variance-authority';
import { type ComponentProps, type MouseEvent } from 'react';

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

function preventDisabledClick(event: MouseEvent<HTMLButtonElement>) {
  event.preventDefault();
}

function preventLoadingClick(event: MouseEvent<HTMLButtonElement>) {
  event.preventDefault();
  event.stopPropagation();
}

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
    let slotClickHandler = onClick;
    if (disabled) {
      slotClickHandler = preventDisabledClick;
    }

    return (
      <Slot
        className={classes}
        aria-disabled={disabled || undefined}
        onClick={slotClickHandler}
        {...props}
      >
        {children}
      </Slot>
    );
  }

  let buttonClickHandler = onClick;
  if (isLoading) {
    buttonClickHandler = preventLoadingClick;
  }

  let content = children;
  if (isLoading) {
    let labelNode: string | null = loadingLabel;
    if (iconOnly) {
      labelNode = null;
    }
    content = (
      <>
        <Spinner aria-hidden="true" className="animate-spin" />
        {labelNode}
      </>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled}
      aria-disabled={isLoading || disabled || undefined}
      aria-busy={isLoading || undefined}
      onClick={buttonClickHandler}
      {...props}
    >
      {content}
    </button>
  );
}

