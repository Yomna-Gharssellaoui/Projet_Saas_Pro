@echo off
setlocal enabledelayedexpansion

:: Define paths with quotes to handle spaces
SET "BASE_DIR=%~dp0"
SET "CHATBOT_DIR=%BASE_DIR%src\modules\invoice-chatbot"
SET "VENV_DIR=%CHATBOT_DIR%\.venv"
SET "PYTHON_EXE=C:\Users\rahou\AppData\Local\Python\bin\python.exe"
SET "VENV_PYTHON=%VENV_DIR%\Scripts\python.exe"

echo [Invoice Chatbot] Starting setup...

:: Create venv if missing
IF NOT EXIST "%VENV_PYTHON%" (
    echo [Invoice Chatbot] Creating virtual environment...
    "%PYTHON_EXE%" -m venv "%VENV_DIR%"
    IF ERRORLEVEL 1 (
        echo [ERROR] Failed to create virtual environment.
        pause
        exit /b 1
    )
    echo [Invoice Chatbot] Installing dependencies...
    "%VENV_PYTHON%" -m pip install --upgrade pip --quiet
    "%VENV_PYTHON%" -m pip install -r "%CHATBOT_DIR%\requirements.txt"
)

:: Start the server
echo.
echo [Invoice Chatbot] Server starting on http://localhost:8011
echo.
"%VENV_PYTHON%" -m uvicorn server:app --host 0.0.0.0 --port 8011 --reload --app-dir "%CHATBOT_DIR%"
pause
