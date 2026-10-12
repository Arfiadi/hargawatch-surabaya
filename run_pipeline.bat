@echo off
setlocal enabledelayedexpansion

:: ====================================================================
:: HargaWatch Surabaya - Production Daily Pipeline Runner
:: Designed for Windows Task Scheduler
:: ====================================================================

:: Navigate to the directory containing this script
cd /d "%~dp0"

:: Ensure logs directory exists
if not exist "logs" mkdir logs

:: Determine Python executable from local virtual environment
if exist ".venv\Scripts\python.exe" (
    set "PYTHON_EXE=.venv\Scripts\python.exe"
) else (
    set "PYTHON_EXE=python"
)

echo ============================================================ >> logs\daily_pipeline.log
echo [START] Daily Run: %DATE% %TIME% >> logs\daily_pipeline.log
echo ============================================================ >> logs\daily_pipeline.log

:: Execute orchestrator and append output
"%PYTHON_EXE%" scripts\run_daily_pipeline.py >> logs\daily_pipeline.log 2>&1
set EXIT_CODE=%ERRORLEVEL%

echo. >> logs\daily_pipeline.log
echo [FINISHED] Exit code: %EXIT_CODE% at %TIME% >> logs\daily_pipeline.log
echo ============================================================ >> logs\daily_pipeline.log
echo. >> logs\daily_pipeline.log

exit /b %EXIT_CODE%
