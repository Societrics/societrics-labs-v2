@echo off
color 0A
echo ==========================================
echo   SOCIETRICS LABS - CLOUD LAUNCHER 🚀
echo ==========================================
echo.

:: 1. Add all changes
echo [1/3] Scanning for changes...
git add .

:: 2. Ask for a note
set /p msg="Enter a note for this update (e.g., 'fixed typo'): "
if "%msg%"=="" set msg="Auto-update via Magic Button"

:: 3. Commit and Push
echo.
echo [2/3] Saving snapshot...
git commit -m "%msg%"

echo.
echo [3/3] Uploading to GitHub & Vercel...
git push

echo.
echo ==========================================
echo   DONE! Your site will update in ~2 mins.
echo ==========================================
echo.
pause