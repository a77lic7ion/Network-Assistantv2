@echo off

echo Terminating existing Node.js processes...
taskkill /F /IM node.exe /T >nul 2>&1
echo Terminating existing Python processes...
taskkill /F /IM python.exe /T >nul 2>&1

echo Cleaning npm cache...
npm cache clean --force

echo Deleting node_modules and package-lock.json...
rmdir /s /q node_modules
del package-lock.json

echo Installing dependencies...
npm install

echo Starting development server...
npm run dev

pause