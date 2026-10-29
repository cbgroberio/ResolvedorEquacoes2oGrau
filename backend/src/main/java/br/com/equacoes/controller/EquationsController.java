package br.com.equacoes.controller;

import br.com.equacoes.api.EquationsApi;
import br.com.equacoes.model.EquationRequest;
import br.com.equacoes.model.EquationResponse;
import br.com.equacoes.service.BhaskaraSolverService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class EquationsController implements EquationsApi {

    private final BhaskaraSolverService solverService;

    public EquationsController(BhaskaraSolverService solverService) {
        this.solverService = solverService;
    }

    @Override
    public ResponseEntity<EquationResponse> solveEquation(EquationRequest equationRequest) {
        String rawEquation = equationRequest != null ? equationRequest.getEquation() : null;
        EquationResponse response = solverService.solve(rawEquation);
        return ResponseEntity.ok(response);
    }
}
