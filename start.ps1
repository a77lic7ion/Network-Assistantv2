Write-Host "Terminating existing Node.js processes..."
Stop-Process -Name "node" -ErrorAction SilentlyContinue -Force

Write-Host "Terminating existing Python processes..."
Stop-Process -Name "python" -ErrorAction SilentlyContinue -Force

Write-Host "Cleaning npm cache..."
npm cache clean --force

Write-Host "Deleting node_modules and package-lock.json..."
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue

Write-Host "Installing dependencies..."
npm config set prefix .
npm install --legacy-peer-deps

Write-Host "Starting development server..."
npm run dev

Read-Host "Press Enter to continue..."