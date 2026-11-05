import { cva, type VariantProps } from 'class-variance-authority';
import { type ComponentProps } from 'react';

import { cn } from '@/shared/ui/_lib/utils';

const alertVariants = cva(
  'relative w-full rounded-xl border px-4 py-3 text-sm shadow-xs',
  {
    variants: {
      variant: {
        default:
          'border-secondary-border bg-secondary text-secondary-foreground',
        destructive:
          'border-destructive-border bg-destructive text-destructive-foreground [&>svg]:text-destructive-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export type AlertProps = ComponentProps<'div'> &
  VariantProps<typeof alertVariants>;

export function Alert({ className, variant, ...props }: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

export function AlertTitle({
  className,
  children,
  ...props
}: ComponentProps<'h5'>) {
  return (
    <h5
      className={cn(
        'mb-1 leading-relaxed font-semibold tracking-tight',
        className,
      )}
      {...props}
    >
      {children}
    </h5>
  );
}

export function AlertDescription({
  className,
  ...props
}: ComponentProps<'div'>) {
  return <div className={cn('text-sm', className)} {...props} />;
}

