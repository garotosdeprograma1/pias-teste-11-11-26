@echo off
setlocal
cd /d "%~dp0"

echo ==================================================
echo   Inicializacao do Backend - PIAS
echo ==================================================
echo.

REM --------------------------------------------------
REM  1) Instala dependencias do projeto e o sqlite3
REM --------------------------------------------------
echo [1/3] Instalando dependencias e o sqlite3...
if exist package.json (
    call npm install
    if errorlevel 1 goto erro
)
call npm install sqlite3 --foreground-scripts
if errorlevel 1 goto erro
echo.

REM --------------------------------------------------
REM  2) Inicializa o banco (db.js)
REM --------------------------------------------------
echo [2/3] Inicializando banco de dados (db.js)...
node db.js
if errorlevel 1 goto erro
echo.

REM --------------------------------------------------
REM  3) Sobe o servidor (server.js)
REM --------------------------------------------------
echo [3/3] Iniciando servidor (server.js)...
echo --------------------------------------------------
echo  Pressione CTRL+C para encerrar o servidor.
echo --------------------------------------------------
echo.
node server.js
if errorlevel 1 goto erro

goto fim

:erro
echo.
echo ==================================================
echo  [ERRO] Falha na etapa anterior.
echo  Verifique as mensagens de erro acima.
echo ==================================================
pause
exit /b 1

:fim
echo.
echo Processo finalizado.
pause
endlocal
