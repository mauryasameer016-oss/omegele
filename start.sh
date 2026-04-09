#!/bin/bash
# Quick start script for stranger.chat
# Run from the root stranger-chat/ directory

echo "🚀 Starting stranger.chat..."

# Backend
cd backend
python -m venv venv 2>/dev/null || true
source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null || true
pip install -r requirements.txt -q
python app.py &
BACKEND_PID=$!
echo "✅ Backend started (PID $BACKEND_PID)"

# Frontend
cd ../frontend
npm install -q
echo "✅ Starting frontend..."
npm start &
FRONTEND_PID=$!

echo ""
echo "  Backend:  http://localhost:5000"
echo "  Frontend: http://localhost:3000"
echo "  Admin:    http://localhost:3000/admin  (admin / admin123)"
echo ""
echo "Press Ctrl+C to stop both servers"

wait
