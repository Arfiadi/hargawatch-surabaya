@echo off
rem Wrapper Task Scheduler - HargaWatch daily catch-up
rem Log di-rotate harian agar tidak pernah terkunci antar-run.
cd /d "C:\Coding SDT\Project\HargaWatch"
if not exist logs mkdir logs

rem ===== Rotasi log: simpan max 7 file terakhir =====
forfiles /P logs /M catchup_*.log /D -8 /C "cmd /c del @path" >nul 2>&1

rem ===== Tulis ke log harian (nama unik per tanggal) =====
set "LOGFILE=logs\catchup_%DATE:~10,4%-%DATE:~4,2%-%DATE:~7,2%.log"
"C:\Users\Nicolaus Prima\AppData\Local\Programs\Python\Python311\python.exe" "C:\Coding SDT\Project\HargaWatch\scripts\update_catchup.py" >> "%LOGFILE%" 2>&1
