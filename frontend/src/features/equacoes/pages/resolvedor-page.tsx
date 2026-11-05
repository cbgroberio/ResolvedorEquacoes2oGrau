import {
  resolveProblemMessage,
  useSolveEquacaoMutation,
} from '../api/solve-equacao';
import { AppFooter } from '../components/app-footer';
import { AppHeader } from '../components/app-header';
import { EquacaoForm } from '../components/equacao-form';
import { PassosBhaskara } from '../components/passos-bhaskara';
import { PlanoCartesiano } from '../components/plano-cartesiano';
import { ResumoMetricas } from '../components/resumo-metricas';
import { useUiPreferencesStore } from '../hooks/use-theme-store';
import { INITIAL_EQUATION_RESULT } from '../model/initial-result';

export function ResolvedorPage() {
  const theme = useUiPreferencesStore((s) => s.theme);
  const toggleTheme = useUiPreferencesStore((s) => s.toggleTheme);
  const zoomFactor = useUiPreferencesStore((s) => s.zoomFactor);
  const zoomIn = useUiPreferencesStore((s) => s.zoomIn);
  const zoomOut = useUiPreferencesStore((s) => s.zoomOut);
  const resetZoom = useUiPreferencesStore((s) => s.resetZoom);

  const solveMutation = useSolveEquacaoMutation();
  const activeData = solveMutation.data ?? INITIAL_EQUATION_RESULT;

  let apiError: { readonly message: string; readonly details: string } | null =
    null;
  if (solveMutation.error) {
    apiError = resolveProblemMessage(solveMutation.error);
  }

  const handleSolveEquation = (equation: string) => {
    resetZoom();
    solveMutation.mutate(equation);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AppHeader theme={theme} onToggleTheme={toggleTheme} />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4xl max-lg:p-6">
        <EquacaoForm
          isLoading={solveMutation.isPending}
          apiError={apiError}
          onSubmitEquation={handleSolveEquation}
        />

        <div id="results-wrapper" className="flex flex-col gap-6">
          <ResumoMetricas data={activeData} />

          <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
            <div className="w-full xl:w-[45%]">
              <PassosBhaskara steps={activeData.steps} />
            </div>

            <div className="w-full xl:w-[55%]">
              <PlanoCartesiano
                data={activeData}
                zoomFactor={zoomFactor}
                theme={theme}
                onZoomIn={zoomIn}
                onZoomOut={zoomOut}
                onResetZoom={resetZoom}
              />
            </div>
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}

