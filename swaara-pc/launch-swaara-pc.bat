@echo off
title A1 Swaara PC Studio
echo ========================================================
echo        A1 SWAARA - HIGH-FIDELITY PC STUDIO
echo      Obsidian Audio Streaming Engine by VarshuAi
echo ========================================================
echo.

cd /d "%~dp0"

:: 1. Verify Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not detected on your system.
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

:: 2. Verify node_modules
if not exist "node_modules\" (
    echo [1/2] Setting up dependencies for A1 Swaara PC...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Dependency installation failed.
        pause
        exit /b 1
    )
)

:: 3. Verify dist bundle
if not exist "dist\" (
    echo [2/2] Compiling production bundle...
    call npm run build
)

echo [READY] Launching A1 Swaara PC Desktop Studio...
echo.
call npm start
