@echo off
rem ============================================================
rem  Khoi dong Prompt Architect qua server local (cong 8931)
rem  Bat buoc chay qua http://localhost de Ollama chap nhan CORS
rem  (mo truc tiep index.html bang file:// se bi Ollama chan 403)
rem ============================================================
cd /d "%~dp0"

echo Dang khoi dong Prompt Architect tai http://localhost:8931 ...
start "" /min cmd /c "npx -y http-server -p 8931 -c-1"

rem Cho server san sang roi mo trinh duyet
timeout /t 3 /nobreak >nul
start "" http://localhost:8931

echo.
echo Ung dung da mo trong trinh duyet.
echo Dong cua so server (cua so thu nho duoi taskbar) de tat ung dung.
