import {
  ArrowsCounterClockwise,
  MagnifyingGlassMinus,
  MagnifyingGlassPlus,
} from '@phosphor-icons/react';
import { type MouseEvent, useEffect, useRef, useState } from 'react';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui';
import {
  CANVAS_HEIGHT,
  CANVAS_PADDING,
  CANVAS_WIDTH,
  drawCartesianPlaneOnCanvas,
  getViewportBounds,
} from '../model/cartesian-canvas';
import {
  type EquacaoResponse,
  formatMathNumber,
} from '../model/equacao.schema';

export type PlanoCartesianoProps = {
  readonly data: EquacaoResponse;
  readonly zoomFactor: number;
  readonly theme: 'light' | 'dark';
  readonly onZoomIn: () => void;
  readonly onZoomOut: () => void;
  readonly onResetZoom: () => void;
};

type TooltipState = {
  readonly visible: boolean;
  readonly text: string;
};

export function PlanoCartesiano({
  data,
  zoomFactor,
  theme,
  onZoomIn,
  onZoomOut,
  onResetZoom,
}: PlanoCartesianoProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    text: '',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }
    drawCartesianPlaneOnCanvas(
      ctx,
      CANVAS_WIDTH,
      CANVAS_HEIGHT,
      data,
      zoomFactor,
      theme,
    );
  }, [data, zoomFactor, theme]);

  const handleMouseMove = (event: MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const safeWidth = rect.width || CANVAS_WIDTH;
    const safeHeight = rect.height || CANVAS_HEIGHT;
    const scaleX = CANVAS_WIDTH / safeWidth;
    const scaleY = CANVAS_HEIGHT / safeHeight;
    const px = (event.clientX - rect.left) * scaleX;
    const py = (event.clientY - rect.top) * scaleY;

    const isInsidePlot =
      px >= CANVAS_PADDING &&
      px <= CANVAS_WIDTH - CANVAS_PADDING &&
      py >= CANVAS_PADDING &&
      py <= CANVAS_HEIGHT - CANVAS_PADDING;

    if (!isInsidePlot) {
      setTooltip({ visible: false, text: '' });
      return;
    }

    const bounds = getViewportBounds(data, zoomFactor);
    const plotW = CANVAS_WIDTH - CANVAS_PADDING * 2;
    const mathX =
      bounds.minX +
      ((px - CANVAS_PADDING) / plotW) * (bounds.maxX - bounds.minX);
    const { a, b, c } = data.coefficients;
    const curveY = a * mathX * mathX + b * mathX + c;

    setTooltip({
      visible: true,
      text: `x = ${formatMathNumber(mathX)}  |  f(x) = ${formatMathNumber(curveY)}`,
    });
  };

  const handleMouseLeave = () => {
    setTooltip({ visible: false, text: '' });
  };

  return (
    <Card aria-label="Gráfico no Plano Cartesiano">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 border-b border-secondary-border">
        <div>
          <CardTitle className="text-lg font-semibold text-foreground">
            2. Projeção no Plano Cartesiano
          </CardTitle>
          <CardDescription className="text-xs text-secondary-foreground">
            Parábola correspondente à função quadrática com raízes reais
            destacadas
          </CardDescription>
        </div>

        <div className="flex items-center gap-2">
          <Button
            id="btn-zoom-in"
            variant="secondary"
            size="sm"
            iconOnly
            aria-label="Aproximar gráfico (Zoom +)"
            title="Aproximar (Zoom +)"
            onClick={onZoomIn}
          >
            <MagnifyingGlassPlus />
          </Button>
          <Button
            id="btn-zoom-out"
            variant="secondary"
            size="sm"
            iconOnly
            aria-label="Afastar gráfico (Zoom -)"
            title="Afastar (Zoom -)"
            onClick={onZoomOut}
          >
            <MagnifyingGlassMinus />
          </Button>
          <Button
            id="btn-zoom-reset"
            variant="secondary"
            size="sm"
            aria-label="Centralizar e resetar zoom do gráfico"
            title="Centralizar Gráfico"
            onClick={onResetZoom}
          >
            <ArrowsCounterClockwise aria-hidden="true" className="size-4" />
            <span>Resetar</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 pt-6">
        <div className="relative w-full overflow-hidden rounded-lg border border-secondary-border bg-background">
          <canvas
            ref={canvasRef}
            id="cartesian-canvas"
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            aria-label={`Gráfico cartesiano da equação ${data.normalizedEquation}`}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="block h-auto w-full cursor-crosshair"
          />

          {tooltip.visible && (
            <div
              id="canvas-tooltip"
              role="status"
              className="pointer-events-none absolute top-3 right-3 rounded-md border border-secondary-border bg-secondary px-3 py-1.5 font-mono text-xs text-foreground shadow-xs"
            >
              {tooltip.text}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-5 border-t border-secondary-border pt-3 text-xs text-secondary-foreground">
          <div className="flex items-center gap-2">
            <span className="inline-block h-1 w-3 rounded-xs bg-primary" />
            <span>Parábola f(x)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block size-3 rounded-full bg-ghost-foreground" />
            <span>Raízes Reais (x₁, x₂) no Eixo X</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block size-3 rounded-full border border-secondary-border bg-primary-hover" />
            <span>Vértice V(xᵥ, yᵥ)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block size-3 rounded-full bg-ring" />
            <span>Interseção Eixo Y (0, c)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

