import {
  BookOpen,
  FilePdf,
  Info,
  Moon,
  Sun,
} from '@phosphor-icons/react';

import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui';

export type AppHeaderProps = {
  readonly theme: 'light' | 'dark';
  readonly onToggleTheme: () => void;
};

export function AppHeader({ theme, onToggleTheme }: AppHeaderProps) {
  const isDark = theme === 'dark';

  let toggleAriaLabel = 'Alternar para modo escuro';
  let toggleLabelText = 'Modo Escuro';
  let themeIcon = <Moon aria-hidden="true" className="size-5" />;

  if (isDark) {
    toggleAriaLabel = 'Alternar para modo claro';
    toggleLabelText = 'Modo Claro';
    themeIcon = <Sun aria-hidden="true" className="size-5" />;
  }

  return (
    <header className="sticky top-0 z-50 min-h-20 border-b border-secondary-border bg-background">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-3">
        <div className="flex items-center gap-4">
          <Badge variant="default" className="px-3 py-1.5 font-mono text-sm">
            f(x) = ax² + bx + c
          </Badge>
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              Resolvedor de Equações do 2º Grau
            </h1>
            <p className="text-xs text-secondary-foreground">
              Fórmula de Bhaskara Passo a Passo • Análise de Delta (Δ) •
              Projeção no Plano Cartesiano
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            id="btn-theme-toggle"
            variant="secondary"
            size="sm"
            aria-label={toggleAriaLabel}
            aria-pressed={isDark}
            onClick={onToggleTheme}
            title="Alternar entre Modo Claro e Modo Escuro"
          >
            {themeIcon}
            <span id="theme-label">{toggleLabelText}</span>
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Info aria-hidden="true" className="size-5" />
                <span>Guia Rápido</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Sobre o Resolvedor de Equações do 2º Grau</DialogTitle>
                <DialogDescription>
                  Ferramenta interativa para resolução algébrica pela Fórmula de
                  Bhaskara e visualização geométrica no Plano Cartesiano.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-3 text-sm text-secondary-foreground">
                <p>
                  <strong>1. Entrada flexível:</strong> Digite equações completas
                  ou incompletas como <code className="font-mono">x^2 - 5x + 6 = 0</code>,{' '}
                  <code className="font-mono">x² - 4x + 4 = 0</code> ou{' '}
                  <code className="font-mono">2x^2 = 8</code>.
                </p>
                <p>
                  <strong>2. Análise de Δ:</strong> Identifique rapidamente se a
                  equação possui 2 raízes reais distintas (Δ &gt; 0), 1 raiz real
                  dupla (Δ = 0) ou nenhuma raiz real (Δ &lt; 0).
                </p>
                <p>
                  <strong>3. Plano Cartesiano:</strong> Explore a parábola com
                  zoom e passe o cursor sobre o gráfico para inspecionar pares
                  ordenados <code className="font-mono">(x, f(x))</code>.
                </p>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="ghost" size="sm" asChild>
            <a
              href="/manual.html"
              target="_blank"
              rel="noopener noreferrer"
              title="Visualização rápida do Manual em HTML"
            >
              <BookOpen aria-hidden="true" className="size-5" />
              <span>Manual (HTML)</span>
            </a>
          </Button>

          <Button variant="ghost" size="sm" asChild>
            <a
              href="/Manual_Resolvedor_Equacoes_2o_Grau.pdf"
              target="_blank"
              rel="noopener noreferrer"
              title="Baixar ou visualizar o Manual em PDF"
            >
              <FilePdf aria-hidden="true" className="size-5" />
              <span>Manual (PDF)</span>
            </a>
          </Button>

          <Badge variant="outline">OpenAPI 3.0</Badge>
          <Badge variant="outline">Java 21 • Spring Boot 4</Badge>
          <Badge variant="outline">Node.js 26</Badge>
        </div>
      </div>
    </header>
  );
}

