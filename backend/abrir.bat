@echo off
setlocal
cd /d "%~dp0"

echo ==================================================
echo   Inicializacao do Backend - PIAS
echo ==================================================
echo.

REM --------------------------------------------------
REM  1) Instala o sqlite3
REM --------------------------------------------------
echo [1/5] Instalando o sqlite3...
call npm install sqlite3
if errorlevel 1 goto erro
echo.

REM --------------------------------------------------
REM  2) Aprova os scripts do sqlite3
REM --------------------------------------------------
echo [2/5] Aprovando scripts do sqlite3...
call npm install-scripts approve sqlite3
if errorlevel 1 goto erro
echo.

REM --------------------------------------------------
REM  3) Reconstroi o binario nativo
REM --------------------------------------------------
echo [3/5] Reconstruindo o sqlite3 (baixando/compilando binario)...
call npm rebuild sqlite3 --foreground-scripts
if errorlevel 1 goto erro
echo.

REM --------------------------------------------------
REM  4) Inicializa o banco (db.js) - deve terminar
REM --------------------------------------------------
echo [4/5] Inicializando banco de dados (db.js)...
node db.js
if errorlevel 1 goto erro
echo.

REM --------------------------------------------------
REM  5) Sobe o servidor (server.js) - fica em execucao
REM --------------------------------------------------
echo [5/5] Iniciando servidor (server.js)...
echo --------------------------------------------------
echo  Pressione CTRL+C para encerrar o servidor.
echo --------------------------------------------------
echo.
node server.js

goto fim

:erro
echo.
echo ==================================================
echo  [ERRO] Falha na etapa anterior.
echo  Verifique as mensagens acima.
echo ==================================================
pause
exit /b 1

:fim
echo.
echo Processo finalizado.
pause
endlocal