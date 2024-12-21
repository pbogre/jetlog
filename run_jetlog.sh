#!/bin/bash

# Step 1: Ensure pipenv is installed
if ! command -v pipenv &>/dev/null; then
    echo "Pipenv is not installed. Please install it with 'pip install pipenv'."
    exit 1
fi

# Step 2: Activate virtual environment and install dependencies
echo "Installing and activating virtual environment..."
pipenv install

# Step 3: Set up environment variables
export DATA_PATH=$(pwd)
export SECRET_KEY="Svbp1SXBO4kJaTycVEWgtbcCBj1dv9OaJJajExUaag9XGI4pvavReFCZDAYbRwgS"
export TOKEN_DURATION=7

# Step 4: Start the application
echo "Starting Jetlog application..."
pipenv run python -m uvicorn main:app --app-dir server --host 0.0.0.0 --port 3000
