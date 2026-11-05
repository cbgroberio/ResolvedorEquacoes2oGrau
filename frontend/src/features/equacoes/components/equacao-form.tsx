import { zodResolver } from '@hookform/resolvers/zod';
import { Calculator, WarningCircle } from '@phosphor-icons/react';
import { useRef } from 'react';
import { useForm } from 'react-hook-form';

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Card,
  CardContent,
  Input,
} from '@/shared/ui';
import {
  type EquacaoFormValues,
  equacaoFormSchema,
  INITIAL_EQUATION,
  QUICK_EXAMPLES,
} from '../model/equacao.schema';

export type EquacaoFormProps = {
  readonly isLoading: boolean;
  readonly apiError: {
    readonly message: string;
    readonly details: string;
  } | null;
  readonly onSubmitEquation: (equation: string) => void;
};

export function EquacaoForm({
  isLoading,
  apiError,
  onSubmitEquation,
}: EquacaoFormProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<EquacaoFormValues>({
    resolver: zodResolver(equacaoFormSchema),
    defaultValues: {
      equation: INITIAL_EQUATION,
    },
  });

  const { ref: registerRef, ...equationField } = register('equation');

  const handleInsertSquare = () => {
    const currentVal = getValues('equation');
    const el = inputRef.current;
    const start = el?.selectionStart ?? currentVal.length;
    const end = el?.selectionEnd ?? currentVal.length;
    const nextValue = `${currentVal.slice(0, start)}x²${currentVal.slice(end)}`;

    setValue('equation', nextValue, { shouldValidate: true });
    if (el) {
      el.focus();
    }
  };

  const handleExampleClick = (eq: string) => {
    setValue('equation', eq, { shouldValidate: true });
    onSubmitEquation(eq);
  };

  const onFormSubmit = (values: EquacaoFormValues) => {
    onSubmitEquation(values.equation);
  };

  return (
    <Card aria-label="Entrada da Equação">
      <CardContent className="p-6">
        <form
          id="equation-form"
          noValidate
          onSubmit={(event) => {
            const submitPromise = handleSubmit(onFormSubmit)(event);
            submitPromise.catch(() => {
              /* Erro tratado pelo estado do formulário */
            });
          }}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start">
            <div className="flex-1">
              <Input
                id="equation-input"
                label="Digite a equação do 2º grau:"
                placeholder="Ex: x^2 - 5x + 6 = 0"
                autoComplete="off"
                error={Boolean(errors.equation)}
                errorMessage={errors.equation?.message}
                inputClass="font-mono text-base"
                ref={(instance) => {
                  registerRef(instance);
                  inputRef.current = instance;
                }}
                {...equationField}
              />
            </div>

            <div className="flex items-center gap-2 lg:mt-6">
              <Button
                id="btn-insert-sq"
                type="button"
                variant="secondary"
                size="md"
                title="Inserir x² na equação"
                onClick={handleInsertSquare}
                className="font-mono font-semibold"
              >
                x²
              </Button>

              <Button
                id="btn-calculate"
                type="submit"
                variant="primary"
                size="md"
                isLoading={isLoading}
                loadingLabel="Calculando"
              >
                <Calculator aria-hidden="true" className="size-5" />
                <span>Calcular Equação</span>
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-medium text-secondary-foreground">
              Exemplos rápidos:
            </span>
            {QUICK_EXAMPLES.map((example) => (
              <Button
                key={example.equation}
                type="button"
                variant="secondary"
                size="sm"
                data-eq={example.equation}
                onClick={() => {
                  handleExampleClick(example.equation);
                }}
                className="h-9 rounded-xl font-mono text-xs"
              >
                <span>{example.label}</span>
                <span className="font-sans text-ghost-foreground">
                  {example.tag}
                </span>
              </Button>
            ))}
          </div>
        </form>

        {Boolean(apiError) && (
          <Alert id="error-banner" variant="destructive" className="mt-4">
            <div className="flex items-start gap-2">
              <WarningCircle
                aria-hidden="true"
                className="mt-0.5 size-5 shrink-0"
              />
              <div>
                <AlertTitle id="error-message">{apiError?.message}</AlertTitle>
                {Boolean(apiError?.details) && (
                  <AlertDescription id="error-details">
                    {apiError?.details}
                  </AlertDescription>
                )}
              </div>
            </div>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

