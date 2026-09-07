@echo off
rem Wrapper Task Scheduler - HargaWatch daily catch-up
rem
rem Path dinamis: root proyek = folder induk dari scripts\ (folder file ini),
rem jadi wrapper tetap benar walau proyek dipindah folder/drive/laptop.
rem Log di-rotate berdasar TANGGAL di nama file (bukan tanggal modifikasi),
rem maks 14 file terakhir agar riwayat 2 minggu selalu ada.

setlocal EnableExtensions

rem ===== Root proyek (folder induk scripts\) =====
set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%\..") do set "ROOT_DIR=%%~fI"
cd /d "%ROOT_DIR%"

if not exist logs mkdir logs

rem ===== Tanggal log (locale-independent, via PowerShell) =====
for /f %%i in ('powershell -NoProfile -Command "Get-Date -Format yyyy-MM-dd"') do set "LOGDATE=%%i"
set "LOGFILE=%ROOT_DIR%\logs\catchup_%LOGDATE%.log"

rem ===== Rotasi log: simpan 14 tanggal terakhir (urut nama = urut tanggal) =====
powershell -NoProfile -Command ^
  "$f = Get-ChildItem -Path '%ROOT_DIR%\logs' -Filter 'catchup_*.log' | Sort-Object Name -Descending; $f | Select-Object -Skip 14 | Remove-Item -Force -ErrorAction SilentlyContinue" >nul 2>&1

rem ===== UTF-8 agar output Python (panah, dsb.) tidak mojibake =====
chcp 65001 >nul
set "PYTHONIOENCODING=utf-8"
set "PYTHONWARNINGS=ignore"

echo ===== %LOGDATE% %TIME% ===== >> "%LOGFILE%"

rem ===== Python: prioritaskan .venv proyek, py launcher (3.x), fallback PATH =====
rem Ask interpreter langsung (bukan 'where') agar Microsoft Store stub lolos.
rem "delims=" wajib: path dengan spasi (mis. C:\Users\Nicolaus Prima\...) tidak boleh terpotong
set "PYEXE="
if exist "%ROOT_DIR%\.venv\Scripts\python.exe" (
    set "PYEXE=%ROOT_DIR%\.venv\Scripts\python.exe"
)
if not defined PYEXE (
    for /f "delims=" %%i in ('py -3 -c "import sys;print(sys.executable)" 2^>nul') do set "PYEXE=%%i"
)
if not defined PYEXE (
    for /f "delims=" %%i in ('python -c "import sys;print(sys.executable)" 2^>nul') do set "PYEXE=%%i"
)
if not defined PYEXE (
    echo [FATAL] Python tidak ditemukan ^(py launcher maupun PATH^). >> "%LOGFILE%"
    echo ===== GAGAL: python tidak ada ===== >> "%LOGFILE%"
    exit /b 2
)

"%PYEXE%" "%ROOT_DIR%\scripts\update_catchup.py" >> "%LOGFILE%" 2>&1
set "RC=%ERRORLEVEL%"

rem ===== Ringkasan status di akhir log (mudah dipindai) =====
if "%RC%"=="0" (
    echo ===== SUKSES ===== >> "%LOGFILE%"
) else (
    echo ===== GAGAL exit=%RC% - periksa output di atas ===== >> "%LOGFILE%"
)

endlocal & exit /b %RC%
