@echo off
cd /d "%~dp0"
start "Redacao ENEM - servidor (feche esta janela para parar o app)" cmd /k npm start
timeout /t 4 /nobreak >nul
start "" "http://localhost:4321"
