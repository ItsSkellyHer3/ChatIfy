#!/bin/bash

# Hard Cleanup
echo "🧹 Cleaning up old sessions..."
kill $(lsof -t -i:3000) 2>/dev/null
kill $(lsof -t -i:8000) 2>/dev/null
rm -f chatify.db 2>/dev/null

# Ensure Directories
mkdir -p server/uploads

# Load .env
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

echo "🚀 Starting Chatify..."

# Start Backend (Python)
echo "📡 Connecting to core service..."
npm run python &
PYTHON_PID=$!

# Wait for Python to bind to port
sleep 2

# Start Gateway (Node.js)
echo "🌐 Launching web app..."
npm start &
NODE_PID=$!

# Start Ngrok (if installed)
if command -v ngrok &> /dev/null; then
    echo "🔗 Preparing secure link..."
    ngrok http 3000 > /dev/null &
    NGROK_PID=$!
    sleep 3
    echo "✅ App is live: $(curl -s localhost:4040/api/tunnels | grep -o 'https://[^"]*')"
else
    echo "✅ App is live: http://localhost:3000"
fi

# Cleanup on exit
trap "kill $NODE_PID $PYTHON_PID $NGROK_PID; exit" SIGINT

wait
