@echo off
cd /d "%~dp0"
if not exist node_modules (
  echo installing dependencies...
  call npm install
)
node proxy.js
pause
