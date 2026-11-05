import {
  type EquacaoResponse,
  formatMathNumber,
} from './equacao.schema';

export type ViewportBounds = {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
};

export type CanvasPalette = {
  readonly bg: string;
  readonly grid: string;
  readonly axis: string;
  readonly axisLabel: string;
  readonly axisTitle: string;
  readonly frameBorder: string;
  readonly parabola: string;
  readonly symmetryLine: string;
  readonly yIntercept: string;
  readonly vertex: string;
  readonly pointStroke: string;
  readonly rootHalo: string;
  readonly rootFill: string;
  readonly rootBoxBg: string;
  readonly rootBoxBorder: string;
  readonly rootBoxText: string;
};

export const CANVAS_WIDTH = 680;
export const CANVAS_HEIGHT = 480;
export const CANVAS_PADDING = 48;

const GRID_DIVISIONS = 8;
const MIN_STEP_GUARD = 1e-6;
const ZERO_AXIS_TOLERANCE = 1e-9;
const PARABOLA_SAMPLES = 240;
const POINT_RADIUS = 5.5;
const ROOT_OUTER_RADIUS = 11;
const ROOT_INNER_RADIUS = 6.5;

const LIGHT_PALETTE: CanvasPalette = {
  bg: '#f9fafb',
  grid: 'rgba(55, 65, 81, 0.12)',
  axis: '#4b5563',
  axisLabel: '#374151',
  axisTitle: '#004b8d',
  frameBorder: '#e5e7eb',
  parabola: '#004b8d',
  symmetryLine: 'rgba(217, 119, 6, 0.45)',
  yIntercept: '#007cc3',
  vertex: '#d97706',
  pointStroke: '#ffffff',
  rootHalo: 'rgba(5, 150, 105, 0.22)',
  rootFill: '#059669',
  rootBoxBg: 'rgba(209, 250, 229, 0.96)',
  rootBoxBorder: '#059669',
  rootBoxText: '#065f46',
};

const DARK_PALETTE: CanvasPalette = {
  bg: '#0c111d',
  grid: 'rgba(206, 207, 210, 0.12)',
  axis: '#85888e',
  axisLabel: '#cecfd2',
  axisTitle: '#f5f5f6',
  frameBorder: '#333741',
  parabola: '#5486b3',
  symmetryLine: 'rgba(245, 158, 11, 0.4)',
  yIntercept: '#3496cf',
  vertex: '#f59e0b',
  pointStroke: '#0c111d',
  rootHalo: 'rgba(16, 185, 129, 0.25)',
  rootFill: '#10b981',
  rootBoxBg: 'rgba(6, 78, 59, 0.92)',
  rootBoxBorder: '#10b981',
  rootBoxText: '#6ee7b7',
};

export function getCanvasThemePalette(theme: 'light' | 'dark'): CanvasPalette {
  if (theme === 'dark') {
    return DARK_PALETTE;
  }
  return LIGHT_PALETTE;
}

export function getViewportBounds(
  data: EquacaoResponse,
  zoomFactor: number,
): ViewportBounds {
  const g = data.graphData;
  const centerX = (g.minX + g.maxX) / 2;
  const centerY = (g.minY + g.maxY) / 2;
  const halfSpanX = ((g.maxX - g.minX) / 2) * zoomFactor;
  const halfSpanY = ((g.maxY - g.minY) / 2) * zoomFactor;

  return {
    minX: centerX - halfSpanX,
    maxX: centerX + halfSpanX,
    minY: centerY - halfSpanY,
    maxY: centerY + halfSpanY,
  };
}

export function chooseNiceStep(range: number): number {
  const roughStep = range / GRID_DIVISIONS;
  const exponent = Math.floor(Math.log10(Math.max(roughStep, MIN_STEP_GUARD)));
  const mag = Math.pow(10, exponent);
  const residual = roughStep / mag;

  if (residual > 5) {
    return 10 * mag;
  }
  if (residual > 2) {
    return 5 * mag;
  }
  if (residual > 1) {
    return 2 * mag;
  }
  return mag;
}

type CoordinateProjector = {
  readonly width: number;
  readonly height: number;
  readonly padding: number;
  readonly plotW: number;
  readonly plotH: number;
  readonly bounds: ViewportBounds;
  readonly toCanvasX: (x: number) => number;
  readonly toCanvasY: (y: number) => number;
};

function createProjector(
  width: number,
  height: number,
  bounds: ViewportBounds,
): CoordinateProjector {
  const padding = CANVAS_PADDING;
  const plotW = width - padding * 2;
  const plotH = height - padding * 2;
  const spanX = bounds.maxX - bounds.minX;
  const spanY = bounds.maxY - bounds.minY;

  return {
    width,
    height,
    padding,
    plotW,
    plotH,
    bounds,
    toCanvasX: (x: number) => padding + ((x - bounds.minX) / spanX) * plotW,
    toCanvasY: (y: number) =>
      height - padding - ((y - bounds.minY) / spanY) * plotH,
  };
}

function drawGridAndAxes(
  ctx: CanvasRenderingContext2D,
  proj: CoordinateProjector,
  palette: CanvasPalette,
): void {
  const { minX, maxX, minY, maxY } = proj.bounds;
  const stepX = chooseNiceStep(maxX - minX);
  const stepY = chooseNiceStep(maxY - minY);

  ctx.lineWidth = 1;
  ctx.strokeStyle = palette.grid;
  ctx.font = '11px Inter, sans-serif';

  const startGridX = Math.ceil(minX / stepX) * stepX;
  for (let gx = startGridX; gx <= maxX; gx += stepX) {
    const cx = proj.toCanvasX(gx);
    ctx.beginPath();
    ctx.moveTo(cx, proj.padding);
    ctx.lineTo(cx, proj.height - proj.padding);
    ctx.stroke();
  }

  const startGridY = Math.ceil(minY / stepY) * stepY;
  for (let gy = startGridY; gy <= maxY; gy += stepY) {
    const cy = proj.toCanvasY(gy);
    ctx.beginPath();
    ctx.moveTo(proj.padding, cy);
    ctx.lineTo(proj.width - proj.padding, cy);
    ctx.stroke();
  }

  const axisX_Y = proj.toCanvasY(0);
  const axisY_X = proj.toCanvasX(0);

  ctx.strokeStyle = palette.axis;
  ctx.lineWidth = 1.8;

  if (axisX_Y >= proj.padding && axisX_Y <= proj.height - proj.padding) {
    ctx.beginPath();
    ctx.moveTo(proj.padding, axisX_Y);
    ctx.lineTo(proj.width - proj.padding, axisX_Y);
    ctx.stroke();
  }

  if (axisY_X >= proj.padding && axisY_X <= proj.width - proj.padding) {
    ctx.beginPath();
    ctx.moveTo(axisY_X, proj.padding);
    ctx.lineTo(axisY_X, proj.height - proj.padding);
    ctx.stroke();
  }

  drawAxisLabels(ctx, proj, palette, startGridX, stepX, startGridY, stepY);
}

function drawAxisLabels(
  ctx: CanvasRenderingContext2D,
  proj: CoordinateProjector,
  palette: CanvasPalette,
  startGridX: number,
  stepX: number,
  startGridY: number,
  stepY: number,
): void {
  const { maxX, maxY } = proj.bounds;
  const axisX_Y = proj.toCanvasY(0);
  const axisY_X = proj.toCanvasX(0);

  ctx.fillStyle = palette.axisLabel;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const labelYPos = Math.min(
    Math.max(axisX_Y + 6, proj.padding + 4),
    proj.height - proj.padding - 16,
  );

  for (let gx = startGridX; gx <= maxX; gx += stepX) {
    if (Math.abs(gx) >= ZERO_AXIS_TOLERANCE) {
      ctx.fillText(formatMathNumber(gx), proj.toCanvasX(gx), labelYPos);
    }
  }

  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  const labelXPos = Math.min(
    Math.max(axisY_X - 8, proj.padding + 28),
    proj.width - proj.padding - 6,
  );

  for (let gy = startGridY; gy <= maxY; gy += stepY) {
    if (Math.abs(gy) >= ZERO_AXIS_TOLERANCE) {
      ctx.fillText(formatMathNumber(gy), labelXPos, proj.toCanvasY(gy));
    }
  }
}

function drawParabolaAndSymmetry(
  ctx: CanvasRenderingContext2D,
  proj: CoordinateProjector,
  data: EquacaoResponse,
  palette: CanvasPalette,
): void {
  const { a, b, c } = data.coefficients;
  const { minX, maxX } = proj.bounds;

  ctx.strokeStyle = palette.parabola;
  ctx.lineWidth = 3;
  ctx.beginPath();

  for (let i = 0; i <= PARABOLA_SAMPLES; i++) {
    const mathX = minX + (i / PARABOLA_SAMPLES) * (maxX - minX);
    const mathY = a * mathX * mathX + b * mathX + c;
    const cx = proj.toCanvasX(mathX);
    const cy = proj.toCanvasY(mathY);
    if (i === 0) {
      ctx.moveTo(cx, cy);
    } else {
      ctx.lineTo(cx, cy);
    }
  }
  ctx.stroke();

  const vxCanvas = proj.toCanvasX(data.vertex.x);
  ctx.save();
  ctx.setLineDash([5, 5]);
  ctx.strokeStyle = palette.symmetryLine;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(vxCanvas, proj.padding);
  ctx.lineTo(vxCanvas, proj.height - proj.padding);
  ctx.stroke();
  ctx.restore();
}

type PointMarkerOptions = {
  readonly cx: number;
  readonly cy: number;
  readonly color: string;
  readonly label: string;
  readonly align: CanvasTextAlign;
  readonly offsetY: number;
  readonly palette: CanvasPalette;
};

function drawPointWithLabel(
  ctx: CanvasRenderingContext2D,
  options: PointMarkerOptions,
): void {
  ctx.save();
  ctx.fillStyle = options.color;
  ctx.beginPath();
  ctx.arc(options.cx, options.cy, POINT_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = options.palette.pointStroke;
  ctx.stroke();

  ctx.font = '600 11.5px Inter, monospace';
  ctx.fillStyle = options.color;
  ctx.textAlign = options.align;
  ctx.textBaseline = 'middle';

  let offsetX = 0;
  if (options.align === 'left') {
    offsetX = -8;
  } else if (options.align === 'right') {
    offsetX = 8;
  }

  ctx.fillText(options.label, options.cx + offsetX, options.cy + options.offsetY);
  ctx.restore();
}

function drawRootHighlight(
  ctx: CanvasRenderingContext2D,
  options: PointMarkerOptions,
): void {
  ctx.save();
  ctx.beginPath();
  ctx.arc(options.cx, options.cy, ROOT_OUTER_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = options.palette.rootHalo;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(options.cx, options.cy, ROOT_INNER_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = options.palette.rootFill;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();

  ctx.font = '600 12px Inter, monospace';
  const textWidth = ctx.measureText(options.label).width;
  let boxX = options.cx - textWidth / 2 - 6;
  if (options.align === 'left') {
    boxX = options.cx - textWidth - 14;
  } else if (options.align === 'right') {
    boxX = options.cx + 8;
  }
  const boxY = options.cy + options.offsetY - 10;

  ctx.fillStyle = options.palette.rootBoxBg;
  ctx.strokeStyle = options.palette.rootBoxBorder;
  ctx.lineWidth = 1;
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(boxX, boxY, textWidth + 12, 20, 4);
  } else {
    ctx.rect(boxX, boxY, textWidth + 12, 20);
  }
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = options.palette.rootBoxText;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(options.label, boxX + 6, boxY + 10);
  ctx.restore();
}

function drawNotablePoints(
  ctx: CanvasRenderingContext2D,
  proj: CoordinateProjector,
  data: EquacaoResponse,
  palette: CanvasPalette,
): void {
  const yInt = data.graphData.yIntercept;
  drawPointWithLabel(ctx, {
    cx: proj.toCanvasX(yInt.x),
    cy: proj.toCanvasY(yInt.y),
    color: palette.yIntercept,
    label: `(0, ${formatMathNumber(yInt.y)})`,
    align: 'right',
    offsetY: -10,
    palette,
  });

  let vertexOffsetY = -16;
  if (data.coefficients.a > 0) {
    vertexOffsetY = 18;
  }

  drawPointWithLabel(ctx, {
    cx: proj.toCanvasX(data.vertex.x),
    cy: proj.toCanvasY(data.vertex.y),
    color: palette.vertex,
    label: `V(${formatMathNumber(data.vertex.x)}, ${formatMathNumber(data.vertex.y)})`,
    align: 'center',
    offsetY: vertexOffsetY,
    palette,
  });

  if (!data.hasRealRoots || data.roots.x1 === null) {
    return;
  }

  const ry = proj.toCanvasY(0);
  if (data.rootCount === 1) {
    drawRootHighlight(ctx, {
      cx: proj.toCanvasX(data.roots.x1),
      cy: ry,
      color: palette.rootFill,
      label: `Raiz x = ${formatMathNumber(data.roots.x1)}`,
      align: 'center',
      offsetY: -18,
      palette,
    });
    return;
  }

  if (data.roots.x2 !== null) {
    drawRootHighlight(ctx, {
      cx: proj.toCanvasX(data.roots.x1),
      cy: ry,
      color: palette.rootFill,
      label: `x₁ (${formatMathNumber(data.roots.x1)}, 0)`,
      align: 'left',
      offsetY: -16,
      palette,
    });
    drawRootHighlight(ctx, {
      cx: proj.toCanvasX(data.roots.x2),
      cy: ry,
      color: palette.rootFill,
      label: `x₂ (${formatMathNumber(data.roots.x2)}, 0)`,
      align: 'right',
      offsetY: -16,
      palette,
    });
  }
}

export function drawCartesianPlaneOnCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  data: EquacaoResponse,
  zoomFactor: number,
  theme: 'light' | 'dark',
): void {
  const palette = getCanvasThemePalette(theme);
  const bounds = getViewportBounds(data, zoomFactor);
  const proj = createProjector(width, height, bounds);

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.beginPath();
  ctx.rect(proj.padding, proj.padding, proj.plotW, proj.plotH);
  ctx.clip();

  drawGridAndAxes(ctx, proj, palette);
  drawParabolaAndSymmetry(ctx, proj, data, palette);
  drawNotablePoints(ctx, proj, data, palette);

  ctx.restore();

  ctx.strokeStyle = palette.frameBorder;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(proj.padding, proj.padding, proj.plotW, proj.plotH);

  const axisX_Y = proj.toCanvasY(0);
  const axisY_X = proj.toCanvasX(0);
  ctx.fillStyle = palette.axisTitle;
  ctx.font = '600 12px Inter, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(
    'Eixo X',
    width - proj.padding - 6,
    Math.min(
      Math.max(axisX_Y - 10, proj.padding + 14),
      height - proj.padding - 8,
    ),
  );
  ctx.textAlign = 'left';
  ctx.fillText(
    'Eixo Y',
    Math.min(
      Math.max(axisY_X + 8, proj.padding + 8),
      width - proj.padding - 50,
    ),
    proj.padding + 14,
  );
}

