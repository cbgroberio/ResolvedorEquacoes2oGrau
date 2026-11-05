import { Dialog, type DialogConfig, DialogRef } from '@angular/cdk/dialog';
import { type ComponentType } from '@angular/cdk/portal';
import { ChangeDetectionStrategy, Component, inject, Injectable, input } from '@angular/core';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { phosphorX } from '@ng-icons/phosphor-icons/regular';

import { Button } from './button';

type AppDialogConfig<R, D, C> = Omit<DialogConfig<D, DialogRef<R, C>>, 'ariaLabel' | 'ariaLabelledBy'> & {
  // Obrigatório no tipo: diálogo sem nome acessível não compila.
  ariaLabel: string;
};

/**
 * Abre diálogos sobre o CDK com o comportamento padrão do design system:
 * modal, foco preso, foco restaurado ao fechar, backdrop e painel com tokens.
 */
@Injectable({ providedIn: 'root' })
export class AppDialog {
  private readonly dialog = inject(Dialog);

  open<R, D = unknown, C = unknown>(
    component: ComponentType<C>,
    config: AppDialogConfig<R, D, C>,
  ): DialogRef<R, C> {
    return this.dialog.open<R, D, C>(component, {
      autoFocus: 'first-tabbable',
      restoreFocus: true,
      ...config,
      ariaModal: true,
      hasBackdrop: true,
      backdropClass: ['fixed', 'inset-0', 'bg-black/80'],
      panelClass: ['w-full', 'max-w-lg', 'p-4'],
    });
  }
}

/**
 * Moldura visual do conteúdo do diálogo: título, descrição, corpo e ação de fechar.
 *
 * Uso dentro do componente aberto pelo `AppDialog`:
 * `<app-dialog-layout title="Excluir chave" description="...">...</app-dialog-layout>`.
 */
@Component({
  selector: 'app-dialog-layout',
  imports: [Button, NgIcon],
  viewProviders: [provideIcons({ phosphorX })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative grid gap-4 rounded-xl border bg-background p-6 text-foreground shadow-lg">
      <header class="flex flex-col space-y-1.5 pr-10">
        <h2 class="text-lg font-semibold leading-none">{{ title() }}</h2>
        @if (description()) {
          <p class="text-sm">{{ description() }}</p>
        }
      </header>

      <ng-content />

      <button
        appButton
        variant="ghost"
        size="sm"
        [iconOnly]="true"
        aria-label="Fechar"
        class="absolute right-4 top-4"
        (click)="dialogRef.close()"
      >
        <ng-icon name="phosphorX" aria-hidden="true" />
      </button>
    </div>
  `,
})
export class DialogLayout {
  readonly title = input.required<string>();
  readonly description = input<string>();

  protected readonly dialogRef = inject(DialogRef);
}
