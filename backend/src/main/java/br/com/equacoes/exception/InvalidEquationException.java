package br.com.equacoes.exception;

public class InvalidEquationException extends RuntimeException {

    private final String code;
    private final String details;

    public InvalidEquationException(String code, String message, String details) {
        super(message);
        this.code = code;
        this.details = details;
    }

    public String getCode() {
        return code;
    }

    public String getDetails() {
        return details;
    }
}
