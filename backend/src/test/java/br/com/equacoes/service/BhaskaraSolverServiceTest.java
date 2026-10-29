package br.com.equacoes.service;

import br.com.equacoes.exception.InvalidEquationException;
import br.com.equacoes.model.EquationResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class BhaskaraSolverServiceTest {

    private BhaskaraSolverService solverService;

    @BeforeEach
    void setUp() {
        EquationParserService parserService = new EquationParserService();
        solverService = new BhaskaraSolverService(parserService);
    }

    @Test
    @DisplayName("Deve resolver equação com Delta > 0 e duas raízes reais distintas (x^2 - 5x + 6 = 0)")
    void shouldSolveEquationWithTwoRealRoots() {
        EquationResponse response = solverService.solve("x^2 - 5x + 6 = 0");

        assertEquals(1.0, response.getCoefficients().getA());
        assertEquals(-5.0, response.getCoefficients().getB());
        assertEquals(6.0, response.getCoefficients().getC());
        assertEquals(1.0, response.getDelta());
        assertTrue(response.getHasRealRoots());
        assertEquals(2, response.getRootCount());
        assertEquals(2.0, response.getRoots().getX1());
        assertEquals(3.0, response.getRoots().getX2());
        assertEquals(2.5, response.getVertex().getX());
        assertEquals(-0.25, response.getVertex().getY());
        assertEquals(5, response.getSteps().size());
        assertFalse(response.getGraphData().getPoints().isEmpty());
    }

    @Test
    @DisplayName("Deve resolver equação com Delta = 0 e uma raiz real dupla (x² - 4x + 4 = 0)")
    void shouldSolveEquationWithSingleRealRoot() {
        EquationResponse response = solverService.solve("x² - 4x + 4 = 0");

        assertEquals(0.0, response.getDelta());
        assertTrue(response.getHasRealRoots());
        assertEquals(1, response.getRootCount());
        assertEquals(2.0, response.getRoots().getX1());
        assertEquals(2.0, response.getRoots().getX2());
        assertEquals(2.0, response.getVertex().getX());
        assertEquals(0.0, response.getVertex().getY());
    }

    @Test
    @DisplayName("Deve resolver equação com Delta < 0 e informar que não possui raízes reais (x^2 + 2x + 5 = 0)")
    void shouldSolveEquationWithNoRealRoots() {
        EquationResponse response = solverService.solve("x^2 + 2x + 5 = 0");

        assertEquals(-16.0, response.getDelta());
        assertFalse(response.getHasRealRoots());
        assertEquals(0, response.getRootCount());
        assertNull(response.getRoots().getX1());
        assertNull(response.getRoots().getX2());
        assertEquals(-1.0, response.getVertex().getX());
        assertEquals(4.0, response.getVertex().getY());
    }

    @Test
    @DisplayName("Deve resolver equação com termos em ambos os lados da igualdade (2x^2 = 8)")
    void shouldSolveIncompleteEquationWithRightHandSide() {
        EquationResponse response = solverService.solve("2x^2 = 8");

        assertEquals(2.0, response.getCoefficients().getA());
        assertEquals(0.0, response.getCoefficients().getB());
        assertEquals(-8.0, response.getCoefficients().getC());
        assertEquals(64.0, response.getDelta());
        assertTrue(response.getHasRealRoots());
        assertEquals(-2.0, response.getRoots().getX1());
        assertEquals(2.0, response.getRoots().getX2());
    }

    @Test
    @DisplayName("Deve lançar erro quando o coeficiente 'a' for zero")
    void shouldThrowExceptionWhenCoefficientAIsZero() {
        InvalidEquationException ex = assertThrows(
                InvalidEquationException.class,
                () -> solverService.solve("5x - 10 = 0")
        );
        assertEquals("NOT_QUADRATIC_EQUATION", ex.getCode());
    }
}
