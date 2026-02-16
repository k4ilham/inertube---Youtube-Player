#!/bin/bash

# Define virtual environment directory
VENV_DIR="venv"

# Check if venv exists, create if not
if [ ! -d "$VENV_DIR" ]; then
    echo "Creating virtual environment..."
    python3 -m venv "$VENV_DIR"
fi

# Activate virtual environment
source "$VENV_DIR/bin/activate"

# Check and install requirements
if [ -f "requirements.txt" ]; then
    echo "Checking and installing requirements..."
    pip install -r requirements.txt
else
    echo "requirements.txt not found!"
    exit 1
fi

# Check if port 5000 is in use
if lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null ; then
    echo "Port 5000 is already in use."
    echo "Please free up the port or change the port in app.py."
    exit 1
fi

# Run the application
echo "Starting application..."
python3 app.py
