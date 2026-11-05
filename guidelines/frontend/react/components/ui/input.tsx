import { EyeIcon, EyeSlashIcon } from '@phosphor-icons/react';
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
  label?: string;
  error?: boolean | undefined;
  errorMessage?: string | undefined;
  showPasswordEye?: boolean;
  containerClass?: string;
  inputClass?: string;
  leftElement?: ReactElement;
  rightElement?: ReactElement;
  onChangeValue?: (value: string) => void;
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
  const inputType = isPassword && showPassword ? 'text' : type;

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
      {label ? <Label htmlFor={inputId}>{label}</Label> : null}

      <div className="relative flex h-11 w-full items-center">
        {leftElement ? (
          <div className={cn(addonClass, 'rounded-l-md')}>{leftElement}</div>
        ) : null}

        <input
          id={inputId}
          type={inputType}
          disabled={disabled}
          aria-invalid={hasError || undefined}
          aria-describedby={errorMessage ? errorId : undefined}
          onChange={handleChange}
          className={cn(
            'h-full min-w-0 flex-1 rounded-md border border-secondary-border bg-transparent px-3 py-1 text-sm text-foreground shadow-xs transition-colors outline-hidden placeholder:text-foreground/75 focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
            hasError &&
              'border-destructive-border focus-visible:ring-ring-destructive',
            leftElement && 'rounded-l-none border-l-0',
            rightElement && 'rounded-r-none border-r-0',
            hasPasswordToggle && 'pr-12',
            inputClass,
          )}
          {...props}
        />

        {hasPasswordToggle ? (
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            disabled={disabled}
            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            className="absolute right-1"
            onClick={() => {
              setShowPassword((current) => !current);
            }}
          >
            {showPassword ? <EyeIcon /> : <EyeSlashIcon />}
          </Button>
        ) : null}

        {!hasPasswordToggle && rightElement ? (
          <div className={cn(addonClass, 'rounded-r-md')}>{rightElement}</div>
        ) : null}
      </div>

      {errorMessage ? (
        <p id={errorId} className="text-sm text-destructive-foreground">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
