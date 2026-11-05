import {
  Badge,
  type BadgeProps,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/ui';
import {
  type EquacaoResponse,
  formatMathNumber,
} from '../model/equacao.schema';

export type ResumoMetricasProps = {
  readonly data: EquacaoResponse;
};

function getDeltaBadgeConfig(delta: number): {
  readonly label: string;
  readonly variant: NonNullable<BadgeProps['variant']>;
} {
  if (delta > 0) {
    return {
      label: 'Possui 2 raízes reais distintas',
      variant: 'default',
    };
  }
  if (delta === 0) {
    return {
      label: 'Possui 1 raiz real dupla',
      variant: 'outline',
    };
  }
  return {
    label: 'Não possui raízes reais',
    variant: 'destructive',
  };
}

export function ResumoMetricas({ data }: ResumoMetricasProps) {
  const { a, b, c } = data.coefficients;
  const deltaBadge = getDeltaBadgeConfig(data.delta);
  const hasValidRealRoots = data.hasRealRoots && data.roots.x1 !== null;
  const isSingleRoot = hasValidRealRoots && data.rootCount === 1;
  const isDoubleRoot = hasValidRealRoots && data.rootCount > 1;

  return (
    <section
      aria-label="Resumo dos Resultados"
      className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
    >
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold tracking-wider text-secondary-foreground uppercase">
            Equação na Forma Reduzida
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <strong
            id="res-normalized"
            className="font-mono text-xl font-semibold text-foreground"
          >
            {data.normalizedEquation}
          </strong>
          <span id="res-coeffs" className="text-xs text-secondary-foreground">
            a = {formatMathNumber(a)} • b = {formatMathNumber(b)} • c ={' '}
            {formatMathNumber(c)}
          </span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold tracking-wider text-secondary-foreground uppercase">
            Discriminante (Delta)
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-start gap-2">
          <strong
            id="res-delta"
            className="font-mono text-xl font-semibold text-foreground"
          >
            Δ = {formatMathNumber(data.delta)}
          </strong>
          <Badge id="res-roots-badge" variant={deltaBadge.variant}>
            {deltaBadge.label}
          </Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold tracking-wider text-secondary-foreground uppercase">
            Raízes Reais (Solução)
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <div id="res-roots-values" className="flex flex-wrap gap-2">
            {isSingleRoot && (
              <Badge variant="default" className="font-mono text-sm">
                x₁ = x₂ = {formatMathNumber(data.roots.x1)}
              </Badge>
            )}
            {isDoubleRoot && (
              <>
                <Badge variant="default" className="font-mono text-sm">
                  x₁ = {formatMathNumber(data.roots.x1)}
                </Badge>
                <Badge variant="default" className="font-mono text-sm">
                  x₂ = {formatMathNumber(data.roots.x2)}
                </Badge>
              </>
            )}
            {!hasValidRealRoots && (
              <Badge variant="destructive" className="font-mono text-sm">
                S = ∅ (Sem raízes em ℝ)
              </Badge>
            )}
          </div>
          <span
            id="res-status-msg"
            className="text-xs text-secondary-foreground"
          >
            {data.rootsStatusMessage}
          </span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold tracking-wider text-secondary-foreground uppercase">
            Vértice da Parábola &amp; Eixo Y
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <strong
            id="res-vertex"
            className="font-mono text-xl font-semibold text-foreground"
          >
            V({formatMathNumber(data.vertex.x)},{' '}
            {formatMathNumber(data.vertex.y)})
          </strong>
          <span
            id="res-y-intercept"
            className="text-xs text-secondary-foreground"
          >
            Interseção Eixo Y: (0,{' '}
            {formatMathNumber(data.graphData.yIntercept.y)})
          </span>
        </CardContent>
      </Card>
    </section>
  );
}

