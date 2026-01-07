#!/bin/bash

echo "Starting Event Pyramide..."
echo ""
echo "Backend: http://localhost:5000"
echo "Frontend: http://localhost:5001"
echo ""

trap 'kill 0' EXIT

python app.py &
npm run dev:client &

wait
