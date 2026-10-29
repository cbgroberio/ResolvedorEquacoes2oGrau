package br.com.equacoes.service;

import br.com.equacoes.model.Coefficients;
import br.com.equacoes.model.EquationResponse;
import br.com.equacoes.model.GraphData;
import br.com.equacoes.model.Point2D;
import br.com.equacoes.model.ResolutionStep;
import br.com.equacoes.model.Roots;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

@Service
public class BhaskaraSolverService {

    private final EquationParserService parserService;

    public BhaskaraSolverService(EquationParserService parserService) {
        this.parserService = parserService;
    }

    public EquationResponse solve(String rawEquation) {
        EquationParserService.ParsedCoefficients parsed = parserService.parse(rawEquation);
        double a = parsed.a();
        double b = parsed.b();
        double c = parsed.c();

        double bSquared = cleanZero(b * b);
        double fourAC = cleanZero(4.0 * a * c);
        double delta = cleanZero(bSquared - fourAC);

        boolean hasRealRoots = delta >= -1e-12;
        int rootCount;
        String rootsStatusMessage;
        Double x1 = null;
        Double x2 = null;

        if (Math.abs(delta) < 1e-12) {
            delta = 0.0;
            rootCount = 1;
            double root = round4(cleanZero(-b / (2.0 * a)));
            x1 = root;
            x2 = root;
            rootsStatusMessage = String.format(
                    "Δ = 0: A equação possui raízes reais e iguais (uma única raiz real dupla: x = %s).",
                    parserService.formatNumber(root)
            );
        } else if (delta > 0) {
            rootCount = 2;
            double sqrtDelta = Math.sqrt(delta);
            double r1 = round4(cleanZero((-b - sqrtDelta) / (2.0 * a)));
            double r2 = round4(cleanZero((-b + sqrtDelta) / (2.0 * a)));
            // Ordena x1 <= x2 para apresentação consistente
            x1 = Math.min(r1, r2);
            x2 = Math.max(r1, r2);
            rootsStatusMessage = String.format(
                    "Δ > 0: A equação possui duas raízes reais e distintas (x₁ = %s e x₂ = %s).",
                    parserService.formatNumber(x1),
                    parserService.formatNumber(x2)
            );
        } else {
            rootCount = 0;
            rootsStatusMessage = "Δ < 0: A equação não possui raízes reais (não há interseção da parábola com o eixo X).";
        }

        double vx = round4(cleanZero(-b / (2.0 * a)));
        double vy = round4(cleanZero(-delta / (4.0 * a)));
        Point2D vertex = new Point2D().x(vx).y(vy);

        List<ResolutionStep> steps = buildSteps(a, b, c, bSquared, fourAC, delta, x1, x2, vx, vy, parsed.normalizedEquation());
        GraphData graphData = buildGraphData(a, b, c, vx, vy, x1, x2);

        return new EquationResponse()
                .inputEquation(rawEquation.trim())
                .normalizedEquation(parsed.normalizedEquation())
                .coefficients(new Coefficients().a(round4(a)).b(round4(b)).c(round4(c)))
                .delta(round4(delta))
                .hasRealRoots(hasRealRoots)
                .rootCount(rootCount)
                .rootsStatusMessage(rootsStatusMessage)
                .roots(new Roots().x1(x1).x2(x2))
                .vertex(vertex)
                .steps(steps)
                .graphData(graphData);
    }

    private List<ResolutionStep> buildSteps(
            double a, double b, double c,
            double bSquared, double fourAC, double delta,
            Double x1, Double x2,
            double vx, double vy,
            String normalizedEquation
    ) {
        List<ResolutionStep> steps = new ArrayList<>();
        String fa = parserService.formatNumber(a);
        String fb = parserService.formatNumber(b);
        String fc = parserService.formatNumber(c);
        String fDelta = parserService.formatNumber(delta);

        // Passo 1: Forma Reduzida e Coeficientes
        steps.add(new ResolutionStep()
                .stepNumber(1)
                .title("Forma Reduzida e Identificação dos Coeficientes")
                .formula("ax² + bx + c = 0")
                .calculation(String.format("%s  ⇒  a = %s,  b = %s,  c = %s", normalizedEquation, fa, fb, fc))
                .explanation("Igualamos a equação a zero na forma padrão ax² + bx + c = 0 e identificamos os coeficientes numéricos a (que acompanha x²), b (que acompanha x) e c (termo independente).")
        );

        // Passo 2: Cálculo do Discriminante (Delta)
        String bParen = b < 0 ? "(" + fb + ")" : fb;
        String aParen = a < 0 ? "(" + fa + ")" : fa;
        String cParen = c < 0 ? "(" + fc + ")" : fc;
        String signFourAC = (-fourAC >= 0) ? "+ " + parserService.formatNumber(-fourAC) : "- " + parserService.formatNumber(Math.abs(fourAC));

        steps.add(new ResolutionStep()
                .stepNumber(2)
                .title("Cálculo do Discriminante (Δ)")
                .formula("Δ = b² - 4 · a · c")
                .calculation(String.format(
                        "Δ = %s² - 4 · %s · %s  ⇒  Δ = %s %s  ⇒  Δ = %s",
                        bParen, aParen, cParen,
                        parserService.formatNumber(bSquared),
                        signFourAC,
                        fDelta
                ))
                .explanation("Substituímos os valores de a, b e c na fórmula do discriminante (Delta) para descobrir a natureza das raízes da equação.")
        );

        // Passo 3: Análise do valor de Delta
        String deltaAnalysisFormula;
        String deltaAnalysisCalc;
        String deltaAnalysisExp;
        if (delta > 0) {
            deltaAnalysisFormula = "Δ > 0  ⇒  2 raízes reais distintas";
            deltaAnalysisCalc = String.format("Δ = %s > 0  (√Δ = √%s ≈ %s)", fDelta, fDelta, parserService.formatNumber(Math.sqrt(delta)));
            deltaAnalysisExp = "Como o valor de Δ é positivo (maior que zero), a equação admite duas raízes reais diferentes e a parábola intercepta o eixo X em dois pontos.";
        } else if (Math.abs(delta) < 1e-12) {
            deltaAnalysisFormula = "Δ = 0  ⇒  1 raiz real dupla (x₁ = x₂)";
            deltaAnalysisCalc = "Δ = 0  (√Δ = 0)";
            deltaAnalysisExp = "Como o valor de Δ é igual a zero, a equação possui duas raízes reais iguais (uma única raiz real) e o vértice da parábola tangencia o eixo X.";
        } else {
            deltaAnalysisFormula = "Δ < 0  ⇒  Não existem raízes no conjunto dos números reais (ℝ)";
            deltaAnalysisCalc = String.format("Δ = %s < 0  (√%s ∉ ℝ)", fDelta, fDelta);
            deltaAnalysisExp = "Como o valor de Δ é negativo (menor que zero), não existe raiz quadrada real de número negativo. Portanto, a equação não possui raízes reais e a parábola não toca o eixo X.";
        }

        steps.add(new ResolutionStep()
                .stepNumber(3)
                .title("Análise do Discriminante (Δ)")
                .formula(deltaAnalysisFormula)
                .calculation(deltaAnalysisCalc)
                .explanation(deltaAnalysisExp)
        );

        // Passo 4: Aplicação da Fórmula de Bhaskara
        String minusB = parserService.formatNumber(cleanZero(-b));
        String twoA = parserService.formatNumber(cleanZero(2.0 * a));

        if (delta >= 0 && x1 != null && x2 != null) {
            String sqrtDeltaStr = parserService.formatNumber(Math.sqrt(delta));
            String calcBhaskara = String.format(
                    "x = (-%s ± √%s) / (2 · %s)  ⇒  x = (%s ± %s) / %s\n" +
                    "• x₁ = (%s - %s) / %s = %s / %s = %s\n" +
                    "• x₂ = (%s + %s) / %s = %s / %s = %s",
                    bParen, fDelta, aParen,
                    minusB, sqrtDeltaStr, twoA,
                    minusB, sqrtDeltaStr, twoA, parserService.formatNumber(cleanZero(-b - Math.sqrt(delta))), twoA, parserService.formatNumber(cleanZero((-b - Math.sqrt(delta)) / (2.0 * a))),
                    minusB, sqrtDeltaStr, twoA, parserService.formatNumber(cleanZero(-b + Math.sqrt(delta))), twoA, parserService.formatNumber(cleanZero((-b + Math.sqrt(delta)) / (2.0 * a)))
            );

            steps.add(new ResolutionStep()
                    .stepNumber(4)
                    .title("Aplicação da Fórmula de Bhaskara")
                    .formula("x = (-b ± √Δ) / (2a)")
                    .calculation(calcBhaskara)
                    .explanation(String.format(
                            "Aplicamos a Fórmula de Bhaskara calculando os dois caminhos (+√Δ e -√Δ), obtendo o conjunto solução S = { %s%s }.",
                            parserService.formatNumber(x1),
                            Math.abs(x1 - x2) > 1e-9 ? ", " + parserService.formatNumber(x2) : ""
                    ))
            );
        } else {
            steps.add(new ResolutionStep()
                    .stepNumber(4)
                    .title("Aplicação da Fórmula de Bhaskara")
                    .formula("x = (-b ± √Δ) / (2a)")
                    .calculation(String.format(
                            "x = (-%s ± √(%s)) / (2 · %s)  ⇒  S = ∅ (Conjunto Vazio em ℝ)",
                            bParen, fDelta, aParen
                    ))
                    .explanation("Como Δ < 0, o cálculo das raízes reais se encerra aqui, pois √Δ não pertence ao conjunto dos números reais (ℝ). O conjunto solução real é vazio (S = ∅).")
            );
        }

        // Passo 5: Vértice e Concavidade para o Plano Cartesiano
        String concavidade = a > 0 ? "voltada para cima (a > 0, ponto de mínimo)" : "voltada para baixo (a < 0, ponto de máximo)";
        steps.add(new ResolutionStep()
                .stepNumber(5)
                .title("Vértice da Parábola e Projeção no Plano Cartesiano")
                .formula("xᵥ = -b / (2a)   |   yᵥ = -Δ / (4a)")
                .calculation(String.format(
                        "xᵥ = %s / %s = %s   |   yᵥ = -(%s) / (4 · %s) = %s   ⇒   V(%s, %s)",
                        minusB, twoA, parserService.formatNumber(vx),
                        fDelta, aParen, parserService.formatNumber(vy),
                        parserService.formatNumber(vx), parserService.formatNumber(vy)
                ))
                .explanation(String.format(
                        "A parábola tem concavidade %s, vértice em V(%s, %s) e intercepta o eixo Y em (0, %s).",
                        concavidade,
                        parserService.formatNumber(vx),
                        parserService.formatNumber(vy),
                        fc
                ))
        );

        return steps;
    }

    private GraphData buildGraphData(double a, double b, double c, double vx, double vy, Double x1, Double x2) {
        // Determina o intervalo horizontal centrado no vértice e englobando raízes e o eixo Y (x = 0)
        double span = 4.0;
        if (x1 != null && x2 != null) {
            double rootDist = Math.abs(x2 - vx);
            span = Math.max(span, rootDist * 1.8 + 2.0);
        }
        // Garante que x = 0 (interseção com eixo Y) também esteja visível quando razoável
        if (Math.abs(vx) < 15.0) {
            span = Math.max(span, Math.abs(vx) + 2.0);
        }

        double minX = round4(vx - span);
        double maxX = round4(vx + span);

        int numSamples = 120;
        double step = (maxX - minX) / numSamples;

        List<Point2D> points = new ArrayList<>(numSamples + 1);
        double minY = Math.min(0.0, vy);
        double maxY = Math.max(0.0, vy);

        for (int i = 0; i <= numSamples; i++) {
            double x = round4(minX + i * step);
            double y = round4(cleanZero(a * x * x + b * x + c));
            points.add(new Point2D().x(x).y(y));
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
        }

        // Adiciona margem vertical de 15% para visualização limpa
        double yRange = Math.max(Math.abs(maxY - minY), 4.0);
        double yPadding = yRange * 0.15;
        double finalMinY = round4(Math.min(minY - yPadding, -2.0));
        double finalMaxY = round4(Math.max(maxY + yPadding, 2.0));

        return new GraphData()
                .minX(minX)
                .maxX(maxX)
                .minY(finalMinY)
                .maxY(finalMaxY)
                .yIntercept(new Point2D().x(0.0).y(round4(c)))
                .points(points);
    }

    private double cleanZero(double val) {
        return Math.abs(val) < 1e-12 ? 0.0 : val;
    }

    private double round4(double val) {
        if (Double.isNaN(val) || Double.isInfinite(val)) {
            return val;
        }
        return BigDecimal.valueOf(cleanZero(val))
                .setScale(4, RoundingMode.HALF_UP)
                .doubleValue();
    }
}
