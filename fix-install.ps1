# Script para resolver problemas de instalacao do better-sqlite3
# Execute: .\fix-install.ps1

Write-Host "[*] Verificando pre-requisitos..." -ForegroundColor Cyan

# Verificar Node.js
Write-Host "`n[*] Verificando Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($nodeVersion) {
    Write-Host "[OK] Node.js encontrado: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "[ERRO] Node.js nao encontrado. Instale Node.js primeiro." -ForegroundColor Red
    exit 1
}

# Verificar Python
Write-Host "`n[*] Verificando Python..." -ForegroundColor Yellow
$pythonVersion = python --version 2>$null
if ($pythonVersion) {
    Write-Host "[OK] Python encontrado: $pythonVersion" -ForegroundColor Green
    
    # Tentar encontrar o caminho do Python
    $pythonPath = (Get-Command python).Source
    Write-Host "   Caminho: $pythonPath" -ForegroundColor Gray
    
    # Configurar npm para usar este Python
    Write-Host "`n[*] Configurando npm para usar Python..." -ForegroundColor Yellow
    npm config set python $pythonPath
    Write-Host "[OK] Configurado!" -ForegroundColor Green
} else {
    Write-Host "[ERRO] Python nao encontrado no PATH" -ForegroundColor Red
    Write-Host "`nSolucoes:" -ForegroundColor Yellow
    Write-Host "   1. Instale Python 3.11+ de https://www.python.org/downloads/" -ForegroundColor White
    Write-Host "   2. Durante a instalacao, marque 'Add Python to PATH'" -ForegroundColor White
    Write-Host "   3. Reinicie o terminal e execute este script novamente" -ForegroundColor White
    
    # Tentar encontrar Python em locais comuns
    Write-Host "`n[*] Procurando Python em locais comuns..." -ForegroundColor Yellow
    $commonPaths = @(
        "$env:LOCALAPPDATA\Programs\Python\Python311\python.exe",
        "$env:LOCALAPPDATA\Programs\Python\Python312\python.exe",
        "C:\Program Files\Python311\python.exe",
        "C:\Program Files\Python312\python.exe"
    )
    
    $found = $false
    foreach ($path in $commonPaths) {
        if (Test-Path $path) {
            Write-Host "   [OK] Encontrado: $path" -ForegroundColor Green
            npm config set python $path
            Write-Host "   [OK] Configurado npm para usar este Python" -ForegroundColor Yellow
            $found = $true
            break
        }
    }
    
    if (-not $found) {
        Write-Host "   [ERRO] Python nao encontrado em locais comuns" -ForegroundColor Red
        Write-Host "`nVoce precisa instalar Python primeiro!" -ForegroundColor Yellow
        exit 1
    }
}

# Limpar cache e node_modules
Write-Host "`n[*] Limpando cache e node_modules..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "[OK] node_modules removido" -ForegroundColor Green
}

if (Test-Path "package-lock.json") {
    Remove-Item -Path "package-lock.json" -Force -ErrorAction SilentlyContinue
    Write-Host "[OK] package-lock.json removido" -ForegroundColor Green
}

npm cache clean --force
Write-Host "[OK] Cache do npm limpo" -ForegroundColor Green

# Tentar instalar
Write-Host "`n[*] Instalando dependencias..." -ForegroundColor Yellow
Write-Host "   Isso pode demorar alguns minutos..." -ForegroundColor Gray

$installResult = npm install 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n[OK] Instalacao concluida com sucesso!" -ForegroundColor Green
    Write-Host "`n[*] Testando better-sqlite3..." -ForegroundColor Yellow
    
    $testResult = node -e "const Database = require('better-sqlite3'); console.log('[OK] better-sqlite3 funcionando!');" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Tudo funcionando corretamente!" -ForegroundColor Green
    } else {
        Write-Host "[AVISO] Instalacao concluida, mas ha um problema ao testar:" -ForegroundColor Yellow
        Write-Host $testResult -ForegroundColor Red
    }
} else {
    Write-Host "`n[ERRO] Erro durante a instalacao" -ForegroundColor Red
    Write-Host "`nUltimas linhas do erro:" -ForegroundColor Yellow
    $installResult | Select-Object -Last 20 | ForEach-Object { Write-Host $_ -ForegroundColor Red }
    
    Write-Host "`nProximos passos:" -ForegroundColor Yellow
    Write-Host "   1. Verifique se instalou o Visual Studio Build Tools" -ForegroundColor White
    Write-Host "   2. Certifique-se de que Python esta no PATH" -ForegroundColor White
    Write-Host "   3. Consulte SOLUCAO_INSTALACAO.md para mais detalhes" -ForegroundColor White
}

Write-Host "`n[*] Script concluido!" -ForegroundColor Cyan
