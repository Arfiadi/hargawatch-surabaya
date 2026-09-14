# Script konfigurasi Windows Task Scheduler untuk HargaWatch
$ErrorActionPreference = "Stop"

$taskName = "HargaWatch Update Harian"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Split-Path -Parent $scriptDir
$vbsPath = Join-Path $scriptDir "run_background.vbs"

Write-Host "Mengonfigurasi Scheduled Task: $taskName"
Write-Host "Target script : $vbsPath"
Write-Host "Working dir   : $rootDir"

# Action: Jalankan silent VBScript
$action = New-ScheduledTaskAction `
    -Execute "wscript.exe" `
    -Argument "`"$vbsPath`"" `
    -WorkingDirectory $rootDir

# Trigger 1: Tiap hari jam 07:00 pagi
$triggerDaily = New-ScheduledTaskTrigger -Daily -At "07:00"

# Trigger 2: Saat Logon (buka/nyalakan laptop) dengan jeda 1 menit agar WiFi sudah tersambung
$triggerLogon = New-ScheduledTaskTrigger -AtLogOn
$triggerLogon.Delay = "PT1M"

# Settings agar ramah laptop:
# - Tetap jalan walau pakai baterai (tidak colok charger)
# - Jangan stop kalau charger dicabut
# - Jalankan otomatis jika jadwal terlewat saat laptop mati (StartWhenAvailable)
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 20) `
    -Priority 6

Register-ScheduledTask `
    -TaskName $taskName `
    -Action $action `
    -Trigger @($triggerDaily, $triggerLogon) `
    -Settings $settings `
    -Description "Otomatisasi catch-up harian HargaWatch ke Supabase saat login / jam 07:00" `
    -Force

Write-Host "Berhasil! Task '$taskName' sudah aktif."
