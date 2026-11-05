import { XIcon } from '@phosphor-icons/react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { type ComponentProps } from 'react';

import { cn } from '@/shared/ui/_lib/utils';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogPortal = DialogPrimitive.Portal;
export const DialogClose = DialogPrimitive.Close;

export function DialogOverlay({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      className={cn(
        'fixed inset-0 z-100 bg-foreground/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0',
        className,
      )}
      {...props}
    />
  );
}

type DialogContentProps = ComponentProps<typeof DialogPrimitive.Content> & {
  withCloseBtn?: boolean;
  overlayProps?: ComponentProps<typeof DialogPrimitive.Overlay>;
};

/**
 * Todo diálogo precisa de `DialogTitle`; sem `DialogDescription`, passar
 * `aria-describedby={undefined}` para o Radix não avisar.
 */
export function DialogContent({
  className,
  children,
  withCloseBtn = true,
  overlayProps,
  ...props
}: DialogContentProps) {
  return (
    <DialogPortal>
      <DialogOverlay {...overlayProps} />

      <DialogPrimitive.Content
        className={cn(
          // `max-w-lg` = 32rem só se a escala nomeada NÃO estiver em `--spacing-*` (ver design-system.md).
          'fixed top-1/2 left-1/2 z-100 grid max-h-[90vh] w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto rounded-xl border border-secondary-border bg-background p-6 text-foreground shadow-lg duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 sm:max-w-lg',
          className,
        )}
        {...props}
      >
        {children}

        {withCloseBtn ? (
          <DialogPrimitive.Close className="absolute top-4 right-4 rounded-sm opacity-70 transition-opacity outline-hidden hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none">
            <XIcon aria-hidden="true" className="size-4" />
            <span className="sr-only">Fechar</span>
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

export function DialogHeader({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('flex flex-col gap-1.5 text-left', className)}
      {...props}
    />
  );
}

export function DialogFooter({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-5',
        className,
      )}
      {...props}
    />
  );
}

export function DialogTitle({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn(
        'text-lg leading-none font-semibold tracking-tight',
        className,
      )}
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn('text-sm text-foreground', className)}
      {...props}
    />
  );
}
