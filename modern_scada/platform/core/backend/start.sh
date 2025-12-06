#!/bin/sh

# Production Startup Script
# Uses Gunicorn as a process manager for Uvicorn workers

# Default configuration
HOST=${HOST:-0.0.0.0}
PORT=${PORT:-8000}
WORKERS=${WORKERS:-4}
LOG_LEVEL=${LOG_LEVEL:-info}

echo "Starting SCADA Backend in PRODUCTION mode..."
echo "Host: $HOST, Port: $PORT, Workers: $WORKERS"

# Run Gunicorn with Uvicorn workers
exec gunicorn app.main:app \
    --workers $WORKERS \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind $HOST:$PORT \
    --log-level $LOG_LEVEL \
    --access-logfile - \
    --error-logfile -
