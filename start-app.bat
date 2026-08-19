@echo off
rem ============================================================
rem  Khoi dong Prompt Architect qua server local (cong 8931)
rem  Bat buoc chay qua http://localhost de Ollama chap nhan CORS
rem  (mo truc tiep index.html bang file:// se bi Ollama chan 403)
rem  Server la Node/Express (server.js) - phuc vu file tinh +
rem  API luu lich su/prompt/thung rac trong thu muc data/
rem
rem  Lan dau chay: tu cai Node.js (neu thieu) + tu cai thu vien
rem  qua setup.js. Khong can lam gi thu cong.
rem ============================================================
cd /d "%~dp0"

set PORT=8931
set URL=http://localhost:%PORT%

rem --- Chua co Node.js thi tu cai bang winget ---
where node >nul 2>&1
if errorlevel 1 (
    echo.
    echo Khong tim thay Node.js. Dang thu tu cai dat bang winget...
    echo.
    where winget >nul 2>&1
    if errorlevel 1 (
        echo May nay khong co winget ^(Windows 10 ban cu^).
        echo Hay tai va cai Node.js LTS tai https://nodejs.org roi chay lai file nay.
        echo.
        pause
        exit /b 1
    )
    winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
    echo.
    where node >nul 2>&1
    if errorlevel 1 (
        echo Da cai Node.js nhung cua so nay chua nhan duoc PATH moi.
        echo Hay DONG cua so nay va chay lai start-app.bat.
        echo.
        pause
        exit /b 1
    )
    echo Da cai xong Node.js.
)

where npm >nul 2>&1
if errorlevel 1 (
    echo.
    echo Tim thay Node.js nhung khong thay npm trong PATH.
    echo Hay cai lai Node.js tai https://nodejs.org roi thu lai.
    echo.
    pause
    exit /b 1
)

rem --- Kiem tra & cai dat moi truong (thu vien, thu muc data, cong) ---
node setup.js
if errorlevel 1 (
    pause
    exit /b 1
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
    echo Nguyen nhan thuong gap: cong %PORT% dang bi chiem boi tien trinh khac.
    echo Kiem tra bang lenh: netstat -ano ^| findstr :%PORT%
    echo Hoac chay chan doan: node setup.js --check
    echo.
    pause
    exit /b 1
)

start "" %URL%

echo.
echo Ung dung da mo trong trinh duyet.
echo Dong cua so server (cua so thu nho duoi taskbar) de tat ung dung.
