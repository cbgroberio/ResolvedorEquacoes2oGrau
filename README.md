# Resolvedor de Equações do 2º Grau — OpenAPI, Java 21 / Spring Boot 4 & Node.js 26

Aplicação completa desenvolvida no padrão **API-First (OpenAPI 3.0.3)** para resolução de equações do 2º grau ($ax^2 + bx + c = 0$).

## Funcionalidades
1. **Passo a Passo com Fórmula de Bhaskara**:
   - Identificação dos coeficientes $a$, $b$ e $c$ na forma reduzida.
   - Cálculo detalhado do discriminante ($\Delta = b^2 - 4ac$).
   - Análise da existência de raízes reais ($\Delta > 0$, $\Delta = 0$, $\Delta < 0$).
   - Aplicação passo a passo da Fórmula de Bhaskara ($x = \frac{-b \pm \sqrt{\Delta}}{2a}$).
   - Cálculo do vértice da parábola $V(x_v, y_v)$ e concavidade.
2. **Análise de Delta ($\Delta$) e Raízes Reais**:
   - Exibição em destaque do valor de $\Delta$, status das raízes reais e valores de $x_1$ e $x_2$.
3. **Plano Cartesiano Interativo**:
   - Projeção gráfica da parábola $f(x) = ax^2 + bx + c$.
   - Destaque visual das **raízes reais** sobre o eixo $X$, vértice $V(x_v, y_v)$, eixo de simetria e interseção com o eixo $Y$ $(0, c)$.
   - Zoom (`+` / `-` / `Resetar`) e inspeção de coordenadas $(x, f(x))$ ao passar o mouse.

## Estrutura do Projeto
```text
├── openapi/
│   └── openapi.yaml                 # Contrato OpenAPI 3.0.3 (API-First)
├── backend/
│   ├── pom.xml                      # Java 21 + Spring Boot 4 + OpenAPI Generator
│   ├── Dockerfile                   # Build multi-stage com Eclipse Temurin 21
│   └── src/
│       ├── main/java/br/com/equacoes/
│       │   ├── EquationApplication.java
│       │   ├── config/WebCorsConfig.java
│       │   ├── controller/EquationsController.java
│       │   ├── exception/GlobalExceptionHandler.java
│       │   └── service/
│       │       ├── EquationParserService.java
│       │       └── BhaskaraSolverService.java
│       └── test/java/br/com/equacoes/service/
│           └── BhaskaraSolverServiceTest.java
├── frontend/
│   ├── package.json                 # Node.js 26
│   ├── Dockerfile                   # Container Node 26 Alpine
│   ├── server.js                    # Servidor HTTP + Proxy OpenAPI
│   ├── solverFallback.js            # Motor OpenAPI-compliant integrado
│   ├── public/
│   │   ├── index.html               # Interface do Usuário
│   │   ├── styles.css               # Estilização Moderna Dark UI
│   │   └── app.js                   # Lógica de UI e Renderização do Plano Cartesiano
│   └── test/
│       └── frontend.test.js         # Testes Automatizados
└── docker-compose.yml               # Orquestração Backend (8080) + Frontend (3000)
```

## Como Executar

### Opção 1: Execução Local Rápida (Windows)
Execute o script PowerShell na raiz do projeto:
```powershell
.\start-local.ps1
```
Ou inicie diretamente o servidor Node.js:
```powershell
& "C:\Program Files\nodejs\node.exe" frontend/server.js
```
Acesse no navegador: **http://localhost:3000**

Para compilar e iniciar o Backend Spring Boot localmente com o JDK 21:
```powershell
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21.0.12"
mvn -f backend/pom.xml spring-boot:run
```
Swagger UI disponível em: **http://localhost:8080/swagger-ui.html**

### Opção 2: Via Docker Compose (Java 21 + Node 26)
```bash
docker compose up --build
```
- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:8080/api/v1/equations/solve`
- **Swagger UI**: `http://localhost:8080/swagger-ui.html`
