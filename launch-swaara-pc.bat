@echo off
title Launch A1 Swaara PC
cd /d "%~dp0"

if exist "A1_Swaara_PC\A1_Swaara.exe" (
    echo Launching A1 Swaara PC Desktop Executable...
    start "" "A1_Swaara_PC\A1_Swaara.exe"
    exit /b 0
)

cd /d "%~dp0\swaara-pc"
call launch-swaara-pc.bat
