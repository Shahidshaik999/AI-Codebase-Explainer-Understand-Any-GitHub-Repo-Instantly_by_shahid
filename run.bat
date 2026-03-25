@echo off
echo Starting AI Codebase Explainer...

:: Start backend in a new terminal window
start "Backend" cmd /k "cd backend && .venv\Scripts\uvicorn.exe app.main:app --reload --port 8000"

:: Wait a moment for backend to initialize
timeout /t 3 /nobreak >nul

:: Start frontend in a new terminal window
start "Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Backend  → http://localhost:8000
echo Frontend → http://localhost:5173
echo.
echo Both servers are starting in separate windows.
pause
