@echo off
echo ========================================
echo   StrangerChat - Starting Up
echo ========================================

:: Start Backend
echo.
echo [1/2] Starting Backend (Flask + SocketIO)...
cd backend
if not exist venv (
    python -m venv venv
)
call venv\Scripts\activate
pip install -r requirements.txt --quiet
start "StrangerChat Backend" cmd /k "python app.py"
cd ..

:: Start Frontend
echo.
echo [2/2] Starting Frontend (React)...
cd frontend
if not exist node_modules (
    echo Installing npm packages...
    npm install
)
start "StrangerChat Frontend" cmd /k "npm start"
cd ..

echo.
echo ========================================
echo  Backend:  http://localhost:5000
echo  Frontend: http://localhost:3000
echo ========================================
echo  Open http://localhost:3000 in browser
echo ========================================
pause
