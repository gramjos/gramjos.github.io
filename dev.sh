#!/bin/bash
# Development script - runs both the web app and Marimo server

echo "🚀 Starting Development Environment"
echo "===================================="
echo ""

# Function to cleanup background processes on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    kill $MARIMO_PID 2>/dev/null
    kill $HTTP_PID 2>/dev/null
    exit
}

trap cleanup EXIT INT TERM

# Start Marimo server in the background
echo "🐍 Starting Marimo server on port 2718..."
marimo edit interactive_analysis.py --host 0.0.0.0 --port 2718 &
MARIMO_PID=$!

# Give Marimo a moment to start
sleep 2

# Start HTTP server for the web app
echo "🌐 Starting web server on port 8000..."
echo ""
echo "📍 Open in browser:"
echo "   Web App: http://localhost:8000"
echo "   Marimo:  http://localhost:2718"
echo ""
echo "💡 Click the 🐍 button in the web app to see the live Marimo notebook!"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

python3 -m http.server 8000 &
HTTP_PID=$!

# Wait for both processes
wait
