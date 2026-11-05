import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/ui';
import { type ResolutionStep } from '../model/equacao.schema';

export type PassosBhaskaraProps = {
  readonly steps: readonly ResolutionStep[];
};

export function PassosBhaskara({ steps }: PassosBhaskaraProps) {
  return (
    <Card aria-label="Passo a Passo da Resolução">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 border-b border-secondary-border">
        <CardTitle className="text-lg font-semibold text-foreground">
          1. Passo a Passo — Fórmula de Bhaskara
        </CardTitle>
        <Badge variant="default" className="font-mono text-xs">
          x = (-b ± √Δ) / 2a
        </Badge>
      </CardHeader>

      <CardContent id="steps-container" className="flex flex-col gap-4 pt-6">
        {steps.map((step) => (
          <article
            key={step.stepNumber}
            className="rounded-lg border border-secondary-border bg-background p-4"
          >
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex size-6 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {step.stepNumber}
                </span>
                <h4 className="text-sm font-semibold text-foreground">
                  {step.title}
                </h4>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                {step.formula}
              </Badge>
            </div>

            <pre className="mb-2 overflow-x-auto rounded-md border border-secondary-border bg-secondary p-3 font-mono text-sm whitespace-pre-line text-ghost-foreground">
              {step.calculation}
            </pre>

            <p className="text-sm text-secondary-foreground">
              {step.explanation}
            </p>
          </article>
        ))}
      </CardContent>
    </Card>
  );
}

