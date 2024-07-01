#!/bin/bash

set -e

start_command="python -m \
               uvicorn \
               main:app \
               --app-dir jetlog \
               --host 0.0.0.0 \
               --port 3000"

gosu ${PUID}:${PGID} ${start_command}
