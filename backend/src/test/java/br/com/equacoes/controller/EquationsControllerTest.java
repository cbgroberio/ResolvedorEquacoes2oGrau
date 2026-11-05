package br.com.equacoes.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class EquationsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("POST /api/v1/equations/solve deve retornar 200 OK e contrato completo para Delta > 0")
    void shouldSolveEquationWithTwoRealRootsViaHttp() throws Exception {
        mockMvc.perform(post("/api/v1/equations/solve")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"equation\": \"x^2 - 5x + 6 = 0\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.inputEquation", is("x^2 - 5x + 6 = 0")))
                .andExpect(jsonPath("$.normalizedEquation", is("x² - 5x + 6 = 0")))
                .andExpect(jsonPath("$.coefficients.a", is(1.0)))
                .andExpect(jsonPath("$.coefficients.b", is(-5.0)))
                .andExpect(jsonPath("$.coefficients.c", is(6.0)))
                .andExpect(jsonPath("$.delta", is(1.0)))
                .andExpect(jsonPath("$.hasRealRoots", is(true)))
                .andExpect(jsonPath("$.rootCount", is(2)))
                .andExpect(jsonPath("$.roots.x1", is(2.0)))
                .andExpect(jsonPath("$.roots.x2", is(3.0)))
                .andExpect(jsonPath("$.vertex.x", is(2.5)))
                .andExpect(jsonPath("$.vertex.y", is(-0.25)))
                .andExpect(jsonPath("$.steps", hasSize(5)))
                .andExpect(jsonPath("$.graphData.yIntercept.x", is(0.0)))
                .andExpect(jsonPath("$.graphData.yIntercept.y", is(6.0)));
    }

    @Test
    @DisplayName("POST /api/v1/equations/solve deve serializar roots.x1 e roots.x2 como null quando Delta < 0")
    void shouldSerializeNullRootsWhenDeltaIsNegative() throws Exception {
        mockMvc.perform(post("/api/v1/equations/solve")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"equation\": \"x^2 + 2x + 5 = 0\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.delta", is(-16.0)))
                .andExpect(jsonPath("$.hasRealRoots", is(false)))
                .andExpect(jsonPath("$.rootCount", is(0)))
                .andExpect(jsonPath("$.roots.x1", nullValue()))
                .andExpect(jsonPath("$.roots.x2", nullValue()))
                .andExpect(jsonPath("$.vertex.x", is(-1.0)))
                .andExpect(jsonPath("$.vertex.y", is(4.0)));
    }

    @Test
    @DisplayName("POST /api/v1/equations/solve deve retornar 400 Bad Request com ErrorResponse quando a = 0")
    void shouldReturnBadRequestWhenNotQuadratic() throws Exception {
        mockMvc.perform(post("/api/v1/equations/solve")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"equation\": \"5x - 10 = 0\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code", is("NOT_QUADRATIC_EQUATION")))
                .andExpect(jsonPath("$.message").isNotEmpty())
                .andExpect(jsonPath("$.details").isNotEmpty());
    }

    @Test
    @DisplayName("POST /api/v1/equations/solve deve retornar 400 Bad Request quando o payload JSON for inválido")
    void shouldReturnBadRequestWhenPayloadIsInvalid() throws Exception {
        mockMvc.perform(post("/api/v1/equations/solve")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code", is("INVALID_REQUEST")));
    }

    @Test
    @DisplayName("OPTIONS /api/v1/equations/solve deve responder CORS preflight para integração com o Frontend")
    void shouldAllowCorsPreflightFromFrontend() throws Exception {
        mockMvc.perform(options("/api/v1/equations/solve")
                        .header("Origin", "http://localhost:3000")
                        .header("Access-Control-Request-Method", "POST"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "*"));
    }
}

