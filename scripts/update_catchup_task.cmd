@echo off
rem Wrapper Task Scheduler - HargaWatch daily catch-up
cd /d "C:\Coding SDT\Project\HargaWatch"
if not exist logs mkdir logs
"C:\Users\Nicolaus Prima\AppData\Local\Programs\Python\Python311\python.exe" "C:\Coding SDT\Project\HargaWatch\scripts\update_catchup.py" >> "C:\Coding SDT\Project\HargaWatch\logs\catchup.log" 2>&1
