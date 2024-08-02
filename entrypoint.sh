#!/bin/bash
set -e

start_command="python -m \
               uvicorn \
               main:app \
               --app-dir server \
               --host 0.0.0.0 \
               --port ${JETLOG_PORT}"

function run_as_root()
{
    echo "Could not set data folder ownership, running Jetlog as root..."
    ${start_command}
    exit 0
}

if [ $(id -u) -eq 0 ] && [ $(id -g) -eq 0 ];
then
    echo "Container running as root, setting permissions to ${PUID}:${PGID}..."
    chown -R ${PUID}:${PGID} ${DATA_PATH} || run_as_root
    gosu ${PUID}:${PGID} ${start_command}
else
    echo "Container running as $(id -u):$(id -g)..."
    ${start_command}
fi
