@echo off
title A1 Swaara Web Studio Launcher
echo ========================================================
echo       A1 SWAARA - WEB STUDIO (BROWSER EDITION)
echo ========================================================
echo.

cd /d "%~dp0\swaara-pc"

start http://localhost:5173
call npx vite --port 5173
