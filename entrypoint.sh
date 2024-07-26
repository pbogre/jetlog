#!/bin/bash
set -e

start_command="python -m \
               uvicorn \
               main:app \
               --app-dir server \
               --host 0.0.0.0 \
               --port ${JETLOG_PORT}"

gosu ${PUID}:${PGID} ${start_command}
