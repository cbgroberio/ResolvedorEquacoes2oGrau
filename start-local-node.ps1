$ErrorActionPreference = "Stop"

Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host " Iniciando Resolvedor de Equacoes do 2o Grau" -ForegroundColor Cyan
Write-Host " Stack: OpenAPI 3.0 | Java 21 / Spring Boot 4 | Node" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan

$NodeExe = "C:\Program Files\nodejs\node.exe"
if (-not (Test-Path $NodeExe)) {
    $NodeExe = "node"
}

Write-Host "`n[1/2] Iniciando servidor Frontend Node.js na porta 3000..." -ForegroundColor Yellow
Start-Process -FilePath $NodeExe -ArgumentList "frontend/server.js" -WorkingDirectory $PSScriptRoot

Write-Host "[OK] Acesse a aplicacao em: http://localhost:3000" -ForegroundColor Green
Write-Host "[OK] Contrato OpenAPI disponivel em: http://localhost:3000/openapi.yaml" -ForegroundColor Green





