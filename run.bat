@echo off
setlocal

REM Define venv directory
set VENV_DIR=venv

REM Check if venv exists, create if not
if not exist "%VENV_DIR%" (
    echo Creating virtual environment...
    python -m venv %VENV_DIR%
)

REM Activate venv
call %VENV_DIR%\Scripts\activate

REM Check and install requirements
if exist "requirements.txt" (
    echo Checking and installing requirements...
    pip install -r requirements.txt
) else (
    echo requirements.txt not found!
    pause
    exit /b
)

REM Check if Port 5000 is in use
netstat -ano | findstr :5000 | findstr "LISTENING" >nul
if %ERRORLEVEL% equ 0 (
    echo Port 5000 is already in use.
    echo Please free up the port or change the port in app.py.
    pause
    exit /b
)

REM Run the application
echo Starting application...
python app.py

pause
