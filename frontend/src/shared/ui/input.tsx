import { Eye, EyeSlash } from '@phosphor-icons/react';
import {
  type ChangeEvent,
  type ComponentProps,
  type ReactElement,
  useId,
  useState,
} from 'react';

import { cn } from '@/shared/ui/_lib/utils';
import { Button } from './button';
import { Label } from './label';

export type InputProps = Omit<ComponentProps<'input'>, 'className'> & {
  label?: string | undefined;
  error?: boolean | undefined;
  errorMessage?: string | undefined;
  showPasswordEye?: boolean | undefined;
  containerClass?: string | undefined;
  inputClass?: string | undefined;
  leftElement?: ReactElement | undefined;
  rightElement?: ReactElement | undefined;
  onChangeValue?: ((value: string) => void) | undefined;
};

export function Input({
  id,
  type,
  disabled,
  label,
  error,
  errorMessage,
  showPasswordEye = false,
  containerClass,
  inputClass,
  leftElement,
  rightElement,
  onChange,
  onChangeValue,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-erro`;
  const [showPassword, setShowPassword] = useState(false);

  const hasError = Boolean(error) || Boolean(errorMessage);
  const isPassword = type === 'password';
  const hasPasswordToggle = isPassword && showPasswordEye;

  let inputType = type;
  if (isPassword && showPassword) {
    inputType = 'text';
  }

  let toggleAriaLabel = 'Mostrar senha';
  let toggleIcon = <EyeSlash />;
  if (showPassword) {
    toggleAriaLabel = 'Ocultar senha';
    toggleIcon = <Eye />;
  }

  let ariaDescribedBy: string | undefined;
  if (errorMessage) {
    ariaDescribedBy = errorId;
  }

  const addonClass = cn(
    'flex h-full items-center border border-secondary-border px-2 text-secondary-foreground',
    hasError && 'border-destructive-border',
    disabled && 'opacity-50',
  );

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange?.(event);
    onChangeValue?.(event.target.value);
  };

  return (
    <div className={cn('flex flex-col gap-2', containerClass)}>
      {Boolean(label) && <Label htmlFor={inputId}>{label}</Label>}

      <div className="relative flex h-11 w-full items-center">
        {Boolean(leftElement) && (
          <div className={cn(addonClass, 'rounded-l-md')}>{leftElement}</div>
        )}

        <input
          id={inputId}
          type={inputType}
          disabled={disabled}
          aria-invalid={hasError || undefined}
          aria-describedby={ariaDescribedBy}
          onChange={handleChange}
          className={cn(
            'h-full min-w-0 flex-1 rounded-md border border-secondary-border bg-transparent px-3 py-1 text-sm text-foreground shadow-xs transition-colors outline-hidden placeholder:text-foreground/75 focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
            hasError &&
              'border-destructive-border focus-visible:ring-ring-destructive',
            Boolean(leftElement) && 'rounded-l-none border-l-0',
            Boolean(rightElement) && 'rounded-r-none border-r-0',
            hasPasswordToggle && 'pr-12',
            inputClass,
          )}
          {...props}
        />

        {hasPasswordToggle && (
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            disabled={disabled}
            aria-label={toggleAriaLabel}
            className="absolute right-1"
            onClick={() => {
              setShowPassword((current) => !current);
            }}
          >
            {toggleIcon}
          </Button>
        )}

        {!hasPasswordToggle && Boolean(rightElement) && (
          <div className={cn(addonClass, 'rounded-r-md')}>{rightElement}</div>
        )}
      </div>

      {Boolean(errorMessage) && (
        <p id={errorId} className="text-sm text-destructive-foreground">
          {errorMessage}
        </p>
      )}
    </div>
  );
}

