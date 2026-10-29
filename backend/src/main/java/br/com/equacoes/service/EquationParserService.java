package br.com.equacoes.service;

import br.com.equacoes.exception.InvalidEquationException;
import org.springframework.stereotype.Service;

import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class EquationParserService {

    private static final Pattern TERM_PATTERN = Pattern.compile(
            "([+-]?\\d*(?:\\.\\d+)?)(x(?:\\^2|²|\\*\\*2)?|x)?",
            Pattern.CASE_INSENSITIVE
    );

    public record ParsedCoefficients(double a, double b, double c, String normalizedEquation) {}

    public ParsedCoefficients parse(String rawEquation) {
        if (rawEquation == null || rawEquation.isBlank()) {
            throw new InvalidEquationException(
                    "EMPTY_EQUATION",
                    "Por favor, digite uma equação do 2º grau.",
                    "Exemplo: x^2 - 5x + 6 = 0"
            );
        }

        // Normaliza espaços, vírgulas decimais, sinais de menos unicode e multiplicação explícita
        String cleaned = rawEquation.trim()
                .replace(" ", "")
                .replace("\t", "")
                .replace("−", "-")
                .replace("–", "-")
                .replace(",", ".")
                .replace("*x", "x")
                .replace("X", "x")
                .replace("x²", "x^2")
                .replace("x**2", "x^2");

        // Verifica se há mais de um sinal de '='
        String[] sides = cleaned.split("=", -1);
        if (sides.length > 2) {
            throw new InvalidEquationException(
                    "INVALID_SYNTAX",
                    "A equação contém múltiplos sinais de igualdade ('=').",
                    "Digite apenas uma igualdade, por exemplo: x^2 - 5x + 6 = 0"
            );
        }

        String leftSide = sides[0];
        String rightSide = sides.length == 2 ? sides[1] : "0";

        if (leftSide.isEmpty() || rightSide.isEmpty()) {
            throw new InvalidEquationException(
                    "INVALID_SYNTAX",
                    "Um dos lados da equação está vazio.",
                    "Exemplo válido: x^2 - 5x + 6 = 0"
            );
        }

        double[] leftCoeffs = parsePolynomialSide(leftSide);
        double[] rightCoeffs = parsePolynomialSide(rightSide);

        double a = cleanZero(leftCoeffs[0] - rightCoeffs[0]);
        double b = cleanZero(leftCoeffs[1] - rightCoeffs[1]);
        double c = cleanZero(leftCoeffs[2] - rightCoeffs[2]);

        if (Math.abs(a) < 1e-12) {
            throw new InvalidEquationException(
                    "NOT_QUADRATIC_EQUATION",
                    "O coeficiente 'a' é igual a zero (a = 0). Esta não é uma equação do 2º grau.",
                    "Uma equação do 2º grau deve conter o termo x² com coeficiente diferente de zero (ex: x^2 - 5x + 6 = 0)."
            );
        }

        String normalized = formatNormalizedEquation(a, b, c);
        return new ParsedCoefficients(a, b, c, normalized);
    }

    private double[] parsePolynomialSide(String side) {
        // Verifica graus inválidos como x^3, x^4, etc.
        if (side.matches(".*x\\^(?!2($|[+-])).+")) {
            throw new InvalidEquationException(
                    "UNSUPPORTED_DEGREE",
                    "A equação possui potência de x diferente de 1 ou 2.",
                    "Apenas equações do 2º grau (ax² + bx + c = 0) são suportadas."
            );
        }

        double a = 0.0;
        double b = 0.0;
        double c = 0.0;

        int index = 0;
        Matcher matcher = TERM_PATTERN.matcher(side);

        while (index < side.length()) {
            if (!matcher.find(index) || matcher.start() != index || matcher.group(0).isEmpty()) {
                throw new InvalidEquationException(
                        "INVALID_SYNTAX",
                        "Não foi possível interpretar o trecho '" + side.substring(index) + "' da equação.",
                        "Use o formato ax^2 + bx + c = 0 (ex: 2x^2 - 4x - 6 = 0)."
                );
            }

            String coeffPart = matcher.group(1);
            String varPart = matcher.group(2);

            if ((coeffPart == null || coeffPart.isEmpty()) && (varPart == null || varPart.isEmpty())) {
                throw new InvalidEquationException(
                        "INVALID_SYNTAX",
                        "Formato de equação inválido.",
                        "Exemplo válido: x^2 - 5x + 6 = 0"
                );
            }

            double value = parseCoefficientValue(coeffPart, varPart != null && !varPart.isEmpty());

            if (varPart == null || varPart.isEmpty()) {
                c += value;
            } else if (varPart.equalsIgnoreCase("x")) {
                b += value;
            } else if (varPart.equalsIgnoreCase("x^2")) {
                a += value;
            } else {
                throw new InvalidEquationException(
                        "INVALID_VARIABLE",
                        "Termo desconhecido: " + matcher.group(0),
                        "Use apenas 'x' como incógnita (ex: x^2 - 5x + 6 = 0)."
                );
            }

            index = matcher.end();
        }

        return new double[]{a, b, c};
    }

    private double parseCoefficientValue(String coeffPart, boolean hasVariable) {
        if (coeffPart == null || coeffPart.isEmpty() || coeffPart.equals("+")) {
            if (!hasVariable) {
                throw new InvalidEquationException(
                        "INVALID_SYNTAX",
                        "Sinal sem número correspondente na equação.",
                        "Verifique os sinais de '+' e '-' na equação digitada."
                );
            }
            return 1.0;
        }
        if (coeffPart.equals("-")) {
            if (!hasVariable) {
                throw new InvalidEquationException(
                        "INVALID_SYNTAX",
                        "Sinal de menos isolado na equação.",
                        "Verifique os sinais na equação digitada."
                );
            }
            return -1.0;
        }
        try {
            return Double.parseDouble(coeffPart);
        } catch (NumberFormatException e) {
            throw new InvalidEquationException(
                    "INVALID_NUMBER",
                    "Número inválido encontrado: '" + coeffPart + "'.",
                    "Use números inteiros ou decimais válidos."
            );
        }
    }

    private double cleanZero(double val) {
        return Math.abs(val) < 1e-12 ? 0.0 : val;
    }

    public String formatNumber(double num) {
        double cleaned = cleanZero(num);
        DecimalFormatSymbols symbols = new DecimalFormatSymbols(Locale.US);
        DecimalFormat df = new DecimalFormat("0.####", symbols);
        return df.format(cleaned);
    }

    private String formatNormalizedEquation(double a, double b, double c) {
        StringBuilder sb = new StringBuilder();

        // Termo ax²
        if (a == 1.0) {
            sb.append("x²");
        } else if (a == -1.0) {
            sb.append("-x²");
        } else {
            sb.append(formatNumber(a)).append("x²");
        }

        // Termo bx
        if (Math.abs(b) > 1e-12) {
            sb.append(b > 0 ? " + " : " - ");
            double absB = Math.abs(b);
            if (absB == 1.0) {
                sb.append("x");
            } else {
                sb.append(formatNumber(absB)).append("x");
            }
        }

        // Termo c
        if (Math.abs(c) > 1e-12) {
            sb.append(c > 0 ? " + " : " - ");
            sb.append(formatNumber(Math.abs(c)));
        }

        sb.append(" = 0");
        return sb.toString();
    }
}
