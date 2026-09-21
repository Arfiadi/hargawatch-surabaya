' Runner background tanpa jendela hitam (silent) untuk Windows Task Scheduler
Set objShell = CreateObject("WScript.Shell")
strScriptDir = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
strCmd = chr(34) & strScriptDir & "\update_catchup_task.cmd" & chr(34)
objShell.Run strCmd, 0, False
Set objShell = Nothing
