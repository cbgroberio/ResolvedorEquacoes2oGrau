import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { cn } from '../_lib/cn';

let sequencia = 0;

/**
 * Campo de texto com label e mensagem de erro, integrado a Reactive Forms.
 *
 * Uso: `<app-input label="CPF" formControlName="cpf" [errorMessage]="erroCpf()" />`.
 */
@Component({
  selector: 'app-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Input), multi: true }],
  template: `
    <div [class]="containerClasses()">
      @if (label()) {
        <label [for]="id" class="text-sm font-medium text-foreground">{{ label() }}</label>
      }

      <input
        [id]="id"
        [type]="type()"
        [value]="value()"
        [disabled]="isDisabled()"
        [attr.placeholder]="placeholder() || null"
        [attr.autocomplete]="autocomplete() || null"
        [attr.aria-invalid]="hasError() || null"
        [attr.aria-describedby]="errorMessage() ? errorId : null"
        [class]="inputClasses()"
        (input)="onInput($event)"
        (blur)="onTouched()"
      />

      @if (errorMessage()) {
        <small [id]="errorId" class="text-sm text-destructive-foreground">{{ errorMessage() }}</small>
      }
    </div>
  `,
})
export class Input implements ControlValueAccessor {
  readonly label = input<string>();
  readonly type = input<'text' | 'email' | 'password' | 'tel' | 'number' | 'search'>('text');
  readonly placeholder = input<string>();
  readonly autocomplete = input<string>();
  readonly error = input(false, { transform: booleanAttribute });
  readonly errorMessage = input<string>();
  readonly containerClass = input('');
  readonly inputClass = input('');

  protected readonly id = `app-input-${++sequencia}`;
  protected readonly errorId = `${this.id}-erro`;
  protected readonly value = signal('');
  protected readonly isDisabled = signal(false);
  protected readonly hasError = computed(() => this.error() || Boolean(this.errorMessage()));

  protected readonly containerClasses = computed(() =>
    cn('flex flex-col space-y-2', this.containerClass()),
  );

  protected readonly inputClasses = computed(() =>
    cn(
      'h-11 w-full min-w-0 rounded-md border border-gray-300 bg-transparent px-3 py-1 text-sm shadow-sm',
      'transition-colors placeholder:text-gray-500',
      'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
      'disabled:cursor-not-allowed disabled:opacity-50',
      this.hasError() && 'border-destructive-border',
      this.inputClass(),
    ),
  );

  private onChange: (valor: string) => void = () => undefined;
  protected onTouched: () => void = () => undefined;

  writeValue(valor: string | null): void {
    this.value.set(valor ?? '');
  }

  registerOnChange(fn: (valor: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(desabilitado: boolean): void {
    this.isDisabled.set(desabilitado);
  }

  protected onInput(event: Event): void {
    const valor = (event.target as HTMLInputElement).value;
    this.value.set(valor);
    this.onChange(valor);
  }
}
