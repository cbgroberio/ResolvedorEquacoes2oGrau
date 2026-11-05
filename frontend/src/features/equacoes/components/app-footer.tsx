export function AppFooter() {
  return (
    <footer className="mt-auto border-t border-secondary-border bg-secondary py-4 text-xs text-secondary-foreground">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6">
        <span>
          Padrão OpenAPI 3.0.3 • Backend Java 21 / Spring Boot 4 • Frontend
          Node.js 26 (React 19 SPA + BFF)
        </span>
        <div className="flex flex-wrap items-center gap-5">
          <a
            href="/manual.html"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-ghost-foreground hover:underline"
          >
            Manual Rápido (HTML)
          </a>
          <a
            href="/Manual_Resolvedor_Equacoes_2o_Grau.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-ghost-foreground hover:underline"
          >
            Baixar Manual (PDF)
          </a>
          <a
            href="/openapi.yaml"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-ghost-foreground hover:underline"
          >
            Visualizar Contrato openapi.yaml
          </a>
        </div>
      </div>
    </footer>
  );
}

