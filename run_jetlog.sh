#!/bin/bash

# Step 1: Ensure necessary tools are installed
echo "Checking for required tools..."
if ! command -v pipenv &>/dev/null; then
    echo "Pipenv is not installed. Please install it with 'pip install pipenv'."
    exit 1
fi

if ! command -v npm &>/dev/null; then
    echo "npm is not installed. Please install Node.js and npm."
    exit 1
fi

# Step 2: Build the frontend
echo "Building the frontend..."
npm i --package-lock-only
npm ci
npm run build

if [ $? -ne 0 ]; then
    echo "Frontend build failed. Exiting."
    exit 1
fi

# Step 3: Install and activate the Python virtual environment
echo "Installing and activating virtual environment..."
pipenv install

if [ $? -ne 0 ]; then
    echo "Pipenv installation failed. Exiting."
    exit 1
fi

# Step 4: Set environment variables
export DATA_PATH=$(pwd)
export SECRET_KEY="Svbp1SXBO4kJaTycVEWgtbcCBj1dv9OaJJajExUaag9XGI4pvavReFCZDAYbRwgS"
export TOKEN_DURATION=7

# Step 5: Start the application
echo "Starting Jetlog application..."
pipenv run python -m uvicorn main:app --app-dir server --host 0.0.0.0 --port 3000