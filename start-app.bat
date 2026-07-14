@echo off
rem ============================================================
rem  Khoi dong Prompt Architect qua server local (cong 8931)
rem  Bat buoc chay qua http://localhost de Ollama chap nhan CORS
rem  (mo truc tiep index.html bang file:// se bi Ollama chan 403)
rem  Server la Node/Express (server.js) - phuc vu file tinh +
rem  API luu lich su/prompt/thung rac trong thu muc data/
rem ============================================================
cd /d "%~dp0"

set PORT=8931
set URL=http://localhost:%PORT%

if not exist "node_modules" (
    echo Lan dau chay: dang cai dat dependencies (npm install)...
    call npm install
)

echo Dang khoi dong Prompt Architect tai %URL% ...
start "" /min cmd /c "npm start"

rem Cho server thuc su phan hoi (thay vi doi co dinh 3 giay) - toi da ~15 giay
set READY=0
for /l %%i in (1,1,30) do (
    curl -s -o nul "%URL%" >nul 2>&1
    if not errorlevel 1 (
        set READY=1
        goto :ready
    )
    timeout /t 1 /nobreak >nul
)
:ready

if "%READY%"=="0" (
    echo.
    echo Khong ket noi duoc toi %URL% sau 15 giay.
    echo Nguyen nhan thuong gap: chua chay "npm install" hoac cong %PORT% dang bi chiem.
    echo Thu chay tay: npm install ^&^& npm start  ^(roi mo %URL% khi thay dong "dang chay tai"^)
    echo.
)

start "" %URL%

echo.
echo Ung dung da mo trong trinh duyet.
echo Dong cua so server (cua so thu nho duoi taskbar) de tat ung dung.
