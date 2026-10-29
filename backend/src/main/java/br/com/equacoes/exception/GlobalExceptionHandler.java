package br.com.equacoes.exception;

import br.com.equacoes.model.ErrorResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(InvalidEquationException.class)
    public ResponseEntity<ErrorResponse> handleInvalidEquation(InvalidEquationException ex) {
        ErrorResponse error = new ErrorResponse()
                .code(ex.getCode())
                .message(ex.getMessage())
                .details(ex.getDetails());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler({MethodArgumentNotValidException.class, HttpMessageNotReadableException.class})
    public ResponseEntity<ErrorResponse> handleValidationError(Exception ex) {
        ErrorResponse error = new ErrorResponse()
                .code("INVALID_REQUEST")
                .message("Requisição inválida. Informe o campo 'equation'.")
                .details("Exemplo esperado: {\"equation\": \"x^2 - 5x + 6 = 0\"}");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneralError(Exception ex) {
        ErrorResponse error = new ErrorResponse()
                .code("INTERNAL_ERROR")
                .message("Erro inesperado ao processar a equação.")
                .details(ex.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}
