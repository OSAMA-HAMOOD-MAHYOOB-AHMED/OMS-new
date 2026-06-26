@echo off
mkdir "%~dp0screenshots" 2>nul
copy "%USERPROFILE%\OneDrive - Universiti Teknologi Malaysia (UTM)\Pictures\Screenshots\Screenshot 2026-06-20*.png" "%~dp0screenshots\" >nul
echo Done! Today's screenshots copied to OMS new\screenshots\
pause
