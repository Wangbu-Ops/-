@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
title DeepSeek Local Service
cd /d "%~dp0"

if not exist "deepseek-local.mjs" (
  echo Missing deepseek-local.mjs.
  goto :failed
)
if not exist "deepseek-request.mjs" (
  echo Missing deepseek-request.mjs.
  goto :failed
)
if not exist "xuexitong-console.js" (
  echo Missing xuexitong-console.js.
  goto :failed
)

set "NODE_EXE="

rem 1) Prefer Node installed on system PATH
for /f "delims=" %%I in ('where node.exe 2^>nul') do if not defined NODE_EXE set "NODE_EXE=%%I"

rem 2) Fall back to the Node bundled with Doubao
if not defined NODE_EXE (
  for /d %%D in ("%LOCALAPPDATA%\Doubao\User Data\sandbox_runtime\bases\*") do (
    if not defined NODE_EXE (
      if exist "%%D\node\node.exe" set "NODE_EXE=%%D\node\node.exe"
    )
  )
)

if not defined NODE_EXE (
  echo Node.js was not found.
  echo Please install Node.js LTS from https://nodejs.org/
  goto :failed
)

echo Using Node: %NODE_EXE%
echo Starting DeepSeek local service...
"%NODE_EXE%" "deepseek-local.mjs"
set "EXIT_CODE=%ERRORLEVEL%"
echo.
echo Local service exited with code %EXIT_CODE%.
pause
exit /b %EXIT_CODE%

:failed
echo.
echo Startup failed. Please copy the exact message above.
pause
exit /b 1