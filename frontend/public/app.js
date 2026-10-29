(() => {
  const form = document.getElementById('equation-form');
  const input = document.getElementById('equation-input');
  const btnInsertSq = document.getElementById('btn-insert-sq');
  const errorBanner = document.getElementById('error-banner');
  const errorMessage = document.getElementById('error-message');
  const errorDetails = document.getElementById('error-details');
  const resultsWrapper = document.getElementById('results-wrapper');

  // Elementos de Resumo
  const resNormalized = document.getElementById('res-normalized');
  const resCoeffs = document.getElementById('res-coeffs');
  const resDelta = document.getElementById('res-delta');
  const resRootsBadge = document.getElementById('res-roots-badge');
  const resRootsValues = document.getElementById('res-roots-values');
  const resStatusMsg = document.getElementById('res-status-msg');
  const resVertex = document.getElementById('res-vertex');
  const resYIntercept = document.getElementById('res-y-intercept');
  const stepsContainer = document.getElementById('steps-container');

  // Canvas & Controles do Plano Cartesiano
  const canvas = document.getElementById('cartesian-canvas');
  const ctx = canvas.getContext('2d');
  const tooltip = document.getElementById('canvas-tooltip');
  const btnZoomIn = document.getElementById('btn-zoom-in');
  const btnZoomOut = document.getElementById('btn-zoom-out');
  const btnZoomReset = document.getElementById('btn-zoom-reset');

  // Seletor de Tema (Modo Claro / Modo Escuro)
  const btnThemeToggle = document.getElementById('btn-theme-toggle');
  const themeIcon = document.getElementById('theme-icon');
  const themeLabel = document.getElementById('theme-label');
  const THEME_STORAGE_KEY = 'equacoes_theme';

  let currentData = null;
  let zoomFactor = 1.0;

  function getActiveTheme() {
    const attr = document.documentElement.getAttribute('data-theme');
    if (attr === 'light' || attr === 'dark') return attr;
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch (_) {}
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark';
  }

  function applyTheme(theme, persist = false) {
    const normalized = theme === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', normalized);
    if (persist) {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, normalized);
      } catch (_) {}
    }
    if (btnThemeToggle) {
      const isLight = normalized === 'light';
      btnThemeToggle.setAttribute('aria-pressed', String(isLight));
      btnThemeToggle.setAttribute(
        'aria-label',
        isLight ? 'Alternar para modo escuro' : 'Alternar para modo claro'
      );
      if (themeIcon) themeIcon.textContent = isLight ? '🌙' : '☀️';
      if (themeLabel) themeLabel.textContent = isLight ? 'Modo Escuro' : 'Modo Claro';
    }
    if (currentData) {
      drawCartesianPlane(currentData);
    }
  }

  if (btnThemeToggle) {
    btnThemeToggle.addEventListener('click', () => {
      const nextTheme = getActiveTheme() === 'light' ? 'dark' : 'light';
      applyTheme(nextTheme, true);
    });
  }

  if (window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    const handleSystemThemeChange = (e) => {
      try {
        if (!localStorage.getItem(THEME_STORAGE_KEY)) {
          applyTheme(e.matches ? 'light' : 'dark', false);
        }
      } catch (_) {}
    };
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleSystemThemeChange);
    }
  }

  applyTheme(getActiveTheme(), false);

  function fmt(num) {
    if (num === null || num === undefined || Number.isNaN(Number(num))) return '—';
    const cleaned = Math.abs(num) < 1e-12 ? 0 : Number(num);
    return Number(cleaned.toFixed(4)).toString();
  }

  // Botão auxiliar para inserir x²
  btnInsertSq.addEventListener('click', () => {
    const start = input.selectionStart || input.value.length;
    const end = input.selectionEnd || input.value.length;
    const text = input.value;
    input.value = text.slice(0, start) + 'x²' + text.slice(end);
    input.focus();
    input.setSelectionRange(start + 2, start + 2);
  });

  // Botões de exemplos rápidos
  document.querySelectorAll('.chip-example').forEach((btn) => {
    btn.addEventListener('click', () => {
      const eq = btn.getAttribute('data-eq');
      input.value = eq;
      solveEquation(eq);
    });
  });

  // Submissão do formulário
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    solveEquation(input.value);
  });

  // Controles de Zoom do Gráfico
  btnZoomIn.addEventListener('click', () => {
    zoomFactor = Math.max(0.35, zoomFactor * 0.78);
    if (currentData) drawCartesianPlane(currentData);
  });

  btnZoomOut.addEventListener('click', () => {
    zoomFactor = Math.min(4.0, zoomFactor * 1.28);
    if (currentData) drawCartesianPlane(currentData);
  });

  btnZoomReset.addEventListener('click', () => {
    zoomFactor = 1.0;
    if (currentData) drawCartesianPlane(currentData);
  });

  // Tooltip interativo ao mover o mouse no Plano Cartesiano
  canvas.addEventListener('mousemove', (e) => {
    if (!currentData) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const px = (e.clientX - rect.left) * scaleX;
    const py = (e.clientY - rect.top) * scaleY;

    const bounds = getViewportBounds(currentData);
    const padding = 48;
    const plotW = canvas.width - padding * 2;
    const plotH = canvas.height - padding * 2;

    if (px < padding || px > canvas.width - padding || py < padding || py > canvas.height - padding) {
      tooltip.classList.add('hidden');
      return;
    }

    const mathX = bounds.minX + ((px - padding) / plotW) * (bounds.maxX - bounds.minX);
    const { a, b, c } = currentData.coefficients;
    const curveY = a * mathX * mathX + b * mathX + c;

    tooltip.textContent = `x = ${fmt(mathX)}  |  f(x) = ${fmt(curveY)}`;
    tooltip.style.left = `${e.clientX - rect.left}px`;
    tooltip.style.top = `${e.clientY - rect.top}px`;
    tooltip.classList.remove('hidden');
  });

  canvas.addEventListener('mouseleave', () => {
    tooltip.classList.add('hidden');
  });

  async function solveEquation(equationStr) {
    hideError();
    try {
      const response = await fetch('/api/v1/equations/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ equation: equationStr })
      });

      const payload = await response.json();

      if (!response.ok) {
        showError(payload.message || 'Equação inválida.', payload.details || '');
        return;
      }

      currentData = payload;
      zoomFactor = 1.0;
      renderResults(payload);
    } catch (err) {
      showError(
        'Não foi possível comunicar com o servidor de cálculo.',
        err.message || 'Verifique se o servidor está em execução.'
      );
    }
  }

  function showError(msg, details) {
    errorMessage.textContent = msg;
    errorDetails.textContent = details || '';
    errorBanner.classList.remove('hidden');
  }

  function hideError() {
    errorBanner.classList.add('hidden');
  }

  function renderResults(data) {
    resultsWrapper.classList.remove('hidden');

    // 1. Equação Normalizada & Coeficientes
    resNormalized.textContent = data.normalizedEquation;
    const { a, b, c } = data.coefficients;
    resCoeffs.textContent = `a = ${fmt(a)}  •  b = ${fmt(b)}  •  c = ${fmt(c)}`;

    // 2. Valor de Delta e Status das Raízes Reais
    resDelta.textContent = `Δ = ${fmt(data.delta)}`;
    resRootsBadge.className = 'status-badge';
    if (data.delta > 0) {
      resRootsBadge.classList.add('badge-positive');
      resRootsBadge.textContent = 'Possui 2 raízes reais distintas';
    } else if (data.delta === 0) {
      resRootsBadge.classList.add('badge-zero');
      resRootsBadge.textContent = 'Possui 1 raiz real dupla';
    } else {
      resRootsBadge.classList.add('badge-negative');
      resRootsBadge.textContent = 'Não possui raízes reais';
    }

    // 3. Raízes Reais
    resRootsValues.innerHTML = '';
    if (data.hasRealRoots && data.roots && data.roots.x1 !== null) {
      if (data.rootCount === 1) {
        const pill = document.createElement('span');
        pill.className = 'root-pill';
        pill.textContent = `x₁ = x₂ = ${fmt(data.roots.x1)}`;
        resRootsValues.appendChild(pill);
      } else {
        const pill1 = document.createElement('span');
        pill1.className = 'root-pill';
        pill1.textContent = `x₁ = ${fmt(data.roots.x1)}`;
        const pill2 = document.createElement('span');
        pill2.className = 'root-pill';
        pill2.textContent = `x₂ = ${fmt(data.roots.x2)}`;
        resRootsValues.appendChild(pill1);
        resRootsValues.appendChild(pill2);
      }
    } else {
      const noRootPill = document.createElement('span');
      noRootPill.className = 'root-pill no-root';
      noRootPill.textContent = 'S = ∅ (Sem raízes em ℝ)';
      resRootsValues.appendChild(noRootPill);
    }
    resStatusMsg.textContent = data.rootsStatusMessage;

    // 4. Vértice e Interseção Eixo Y
    resVertex.textContent = `V(${fmt(data.vertex.x)}, ${fmt(data.vertex.y)})`;
    resYIntercept.textContent = `Interseção Eixo Y: (0, ${fmt(data.graphData.yIntercept.y)})`;

    // 5. Passo a Passo da Fórmula de Bhaskara
    stepsContainer.innerHTML = '';
    (data.steps || []).forEach((step) => {
      const item = document.createElement('div');
      item.className = 'step-item';
      item.innerHTML = `
        <div class="step-top">
          <div class="step-title">
            <span class="step-badge">${step.stepNumber}</span>
            <span>${escapeHtml(step.title)}</span>
          </div>
          <span class="step-formula">${escapeHtml(step.formula)}</span>
        </div>
        <div class="step-calc">${escapeHtml(step.calculation)}</div>
        <p class="step-exp">${escapeHtml(step.explanation)}</p>
      `;
      stepsContainer.appendChild(item);
    });

    // 6. Desenha o Plano Cartesiano
    drawCartesianPlane(data);
  }

  function getViewportBounds(data) {
    const g = data.graphData;
    const centerX = (g.minX + g.maxX) / 2;
    const centerY = (g.minY + g.maxY) / 2;
    const halfSpanX = ((g.maxX - g.minX) / 2) * zoomFactor;
    const halfSpanY = ((g.maxY - g.minY) / 2) * zoomFactor;

    return {
      minX: centerX - halfSpanX,
      maxX: centerX + halfSpanX,
      minY: centerY - halfSpanY,
      maxY: centerY + halfSpanY
    };
  }

  function chooseNiceStep(range) {
    const roughStep = range / 8;
    const mag = Math.pow(10, Math.floor(Math.log10(Math.max(roughStep, 1e-6))));
    const residual = roughStep / mag;
    if (residual > 5) return 10 * mag;
    if (residual > 2) return 5 * mag;
    if (residual > 1) return 2 * mag;
    return mag;
  }

  function getCanvasThemePalette() {
    const isLight = getActiveTheme() === 'light';
    if (isLight) {
      return {
        bg: '#f8fafc',
        grid: 'rgba(71, 85, 105, 0.14)',
        axis: '#475569',
        axisLabel: '#334155',
        axisTitle: '#0f172a',
        frameBorder: '#cbd5e1',
        parabola: '#0284c7',
        symmetryLine: 'rgba(217, 119, 6, 0.45)',
        yIntercept: '#7c3aed',
        vertex: '#d97706',
        pointStroke: '#ffffff',
        rootHalo: 'rgba(5, 150, 105, 0.22)',
        rootFill: '#059669',
        rootBoxBg: 'rgba(209, 250, 229, 0.96)',
        rootBoxBorder: '#059669',
        rootBoxText: '#065f46'
      };
    }
    return {
      bg: '#0b1120',
      grid: 'rgba(148, 163, 184, 0.12)',
      axis: '#64748b',
      axisLabel: '#94a3b8',
      axisTitle: '#e2e8f0',
      frameBorder: '#334155',
      parabola: '#38bdf8',
      symmetryLine: 'rgba(245, 158, 11, 0.35)',
      yIntercept: '#a855f7',
      vertex: '#f59e0b',
      pointStroke: '#0b1120',
      rootHalo: 'rgba(16, 185, 129, 0.25)',
      rootFill: '#10b981',
      rootBoxBg: 'rgba(6, 78, 59, 0.92)',
      rootBoxBorder: '#10b981',
      rootBoxText: '#6ee7b7'
    };
  }

  function drawCartesianPlane(data) {
    const palette = getCanvasThemePalette();
    const width = canvas.width;
    const height = canvas.height;
    const padding = 48;
    const plotW = width - padding * 2;
    const plotH = height - padding * 2;

    const bounds = getViewportBounds(data);
    const { minX, maxX, minY, maxY } = bounds;

    const toCanvasX = (x) => padding + ((x - minX) / (maxX - minX)) * plotW;
    const toCanvasY = (y) => height - padding - ((y - minY) / (maxY - minY)) * plotH;

    // Fundo
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = palette.bg;
    ctx.fillRect(0, 0, width, height);

    // Recorte da área de plotagem
    ctx.save();
    ctx.beginPath();
    ctx.rect(padding, padding, plotW, plotH);
    ctx.clip();

    // Grade (Grid)
    const stepX = chooseNiceStep(maxX - minX);
    const stepY = chooseNiceStep(maxY - minY);

    ctx.lineWidth = 1;
    ctx.strokeStyle = palette.grid;
    ctx.fillStyle = palette.axis;
    ctx.font = '11px Inter, sans-serif';

    const startGridX = Math.ceil(minX / stepX) * stepX;
    for (let gx = startGridX; gx <= maxX; gx += stepX) {
      const cx = toCanvasX(gx);
      ctx.beginPath();
      ctx.moveTo(cx, padding);
      ctx.lineTo(cx, height - padding);
      ctx.stroke();
    }

    const startGridY = Math.ceil(minY / stepY) * stepY;
    for (let gy = startGridY; gy <= maxY; gy += stepY) {
      const cy = toCanvasY(gy);
      ctx.beginPath();
      ctx.moveTo(padding, cy);
      ctx.lineTo(width - padding, cy);
      ctx.stroke();
    }

    // Eixos X (y = 0) e Y (x = 0)
    const axisX_Y = toCanvasY(0);
    const axisY_X = toCanvasX(0);

    ctx.strokeStyle = palette.axis;
    ctx.lineWidth = 1.8;

    // Eixo X
    if (axisX_Y >= padding && axisX_Y <= height - padding) {
      ctx.beginPath();
      ctx.moveTo(padding, axisX_Y);
      ctx.lineTo(width - padding, axisX_Y);
      ctx.stroke();
    }

    // Eixo Y
    if (axisY_X >= padding && axisY_X <= width - padding) {
      ctx.beginPath();
      ctx.moveTo(axisY_X, padding);
      ctx.lineTo(axisY_X, height - padding);
      ctx.stroke();
    }

    // Rótulos numéricos nos eixos
    ctx.fillStyle = palette.axisLabel;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const labelYPos = Math.min(Math.max(axisX_Y + 6, padding + 4), height - padding - 16);
    for (let gx = startGridX; gx <= maxX; gx += stepX) {
      if (Math.abs(gx) < 1e-9) continue;
      const cx = toCanvasX(gx);
      ctx.fillText(fmt(gx), cx, labelYPos);
    }

    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    const labelXPos = Math.min(Math.max(axisY_X - 8, padding + 28), width - padding - 6);
    for (let gy = startGridY; gy <= maxY; gy += stepY) {
      if (Math.abs(gy) < 1e-9) continue;
      const cy = toCanvasY(gy);
      ctx.fillText(fmt(gy), labelXPos, cy);
    }

    // Curva da Parábola f(x) = ax² + bx + c
    const { a, b, c } = data.coefficients;
    ctx.strokeStyle = palette.parabola;
    ctx.lineWidth = 3;
    ctx.beginPath();

    const samples = 240;
    for (let i = 0; i <= samples; i++) {
      const mathX = minX + (i / samples) * (maxX - minX);
      const mathY = a * mathX * mathX + b * mathX + c;
      const cx = toCanvasX(mathX);
      const cy = toCanvasY(mathY);
      if (i === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    }
    ctx.stroke();

    // Linha tracejada de simetria passando pelo Vértice
    const vxCanvas = toCanvasX(data.vertex.x);
    ctx.save();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = palette.symmetryLine;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(vxCanvas, padding);
    ctx.lineTo(vxCanvas, height - padding);
    ctx.stroke();
    ctx.restore();

    // Ponto de Interseção com Eixo Y (0, c)
    if (data.graphData.yIntercept) {
      const yInt = data.graphData.yIntercept;
      drawPointWithLabel(
        toCanvasX(yInt.x),
        toCanvasY(yInt.y),
        palette.yIntercept,
        `(0, ${fmt(yInt.y)})`,
        'right',
        -10,
        palette
      );
    }

    // Ponto do Vértice V(xv, yv)
    drawPointWithLabel(
      toCanvasX(data.vertex.x),
      toCanvasY(data.vertex.y),
      palette.vertex,
      `V(${fmt(data.vertex.x)}, ${fmt(data.vertex.y)})`,
      'center',
      a > 0 ? 18 : -16,
      palette
    );

    // Destaque Especial para as Raízes Reais no Eixo X
    if (data.hasRealRoots && data.roots && data.roots.x1 !== null) {
      if (data.rootCount === 1) {
        const rx = toCanvasX(data.roots.x1);
        const ry = toCanvasY(0);
        drawRootHighlight(rx, ry, `Raiz x = ${fmt(data.roots.x1)}`, 'center', -18, palette);
      } else {
        const rx1 = toCanvasX(data.roots.x1);
        const rx2 = toCanvasX(data.roots.x2);
        const ry = toCanvasY(0);
        drawRootHighlight(rx1, ry, `x₁ (${fmt(data.roots.x1)}, 0)`, 'left', -16, palette);
        drawRootHighlight(rx2, ry, `x₂ (${fmt(data.roots.x2)}, 0)`, 'right', -16, palette);
      }
    }

    ctx.restore();

    // Moldura e títulos dos eixos X e Y
    ctx.strokeStyle = palette.frameBorder;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(padding, padding, plotW, plotH);

    ctx.fillStyle = palette.axisTitle;
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('Eixo X', width - padding - 6, Math.min(Math.max(axisX_Y - 10, padding + 14), height - padding - 8));
    ctx.textAlign = 'left';
    ctx.fillText('Eixo Y', Math.min(Math.max(axisY_X + 8, padding + 8), width - padding - 50), padding + 14);
  }

  function drawPointWithLabel(cx, cy, color, label, align = 'center', offsetY = -12, palette = getCanvasThemePalette()) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = palette.pointStroke;
    ctx.stroke();

    ctx.font = 'bold 11.5px "JetBrains Mono", monospace';
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    const offsetX = align === 'left' ? -8 : align === 'right' ? 8 : 0;
    ctx.fillText(label, cx + offsetX, cy + offsetY);
    ctx.restore();
  }

  function drawRootHighlight(cx, cy, label, align, offsetY, palette = getCanvasThemePalette()) {
    ctx.save();
    // Halo luminoso para destacar a raiz real
    ctx.beginPath();
    ctx.arc(cx, cy, 11, 0, Math.PI * 2);
    ctx.fillStyle = palette.rootHalo;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, 6.5, 0, Math.PI * 2);
    ctx.fillStyle = palette.rootFill;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // Caixa de rótulo da raiz
    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    const textWidth = ctx.measureText(label).width;
    let boxX = cx - textWidth / 2 - 6;
    if (align === 'left') boxX = cx - textWidth - 14;
    if (align === 'right') boxX = cx + 8;
    const boxY = cy + offsetY - 10;

    ctx.fillStyle = palette.rootBoxBg;
    ctx.strokeStyle = palette.rootBoxBorder;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, textWidth + 12, 20, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = palette.rootBoxText;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, boxX + 6, boxY + 10);
    ctx.restore();
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // Calcula a equação inicial ao abrir a página
  solveEquation(input.value);
})();
