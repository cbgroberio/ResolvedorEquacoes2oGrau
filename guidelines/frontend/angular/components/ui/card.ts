import { computed, Directive, input } from '@angular/core';

import { cn } from '../_lib/cn';

// Diretivas de atributo: o consumidor escolhe o elemento semântico
// (`<section appCard>`, `<h2 appCardTitle>`), e a diretiva só aplica a aparência.

@Directive({ selector: '[appCard]', host: { '[class]': 'classes()' } })
export class Card {
  readonly userClass = input('', { alias: 'class' });
  protected readonly classes = computed(() =>
    cn('rounded-xl border bg-background shadow-none', this.userClass()),
  );
}

@Directive({ selector: '[appCardHeader]', host: { '[class]': 'classes()' } })
export class CardHeader {
  readonly userClass = input('', { alias: 'class' });
  protected readonly classes = computed(() => cn('flex flex-col space-y-1.5 p-6', this.userClass()));
}

@Directive({ selector: '[appCardTitle]', host: { '[class]': 'classes()' } })
export class CardTitle {
  readonly userClass = input('', { alias: 'class' });
  protected readonly classes = computed(() =>
    cn('text-lg font-semibold leading-none tracking-tight', this.userClass()),
  );
}

@Directive({ selector: '[appCardDescription]', host: { '[class]': 'classes()' } })
export class CardDescription {
  readonly userClass = input('', { alias: 'class' });
  protected readonly classes = computed(() => cn('text-sm', this.userClass()));
}

@Directive({ selector: '[appCardContent]', host: { '[class]': 'classes()' } })
export class CardContent {
  readonly userClass = input('', { alias: 'class' });
  protected readonly classes = computed(() => cn('p-6 pt-0', this.userClass()));
}

@Directive({ selector: '[appCardFooter]', host: { '[class]': 'classes()' } })
export class CardFooter {
  readonly userClass = input('', { alias: 'class' });
  protected readonly classes = computed(() => cn('flex items-center p-6 pt-0', this.userClass()));
}
