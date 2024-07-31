#!/bin/bash
set -e

start_command="python -m \
               uvicorn \
               main:app \
               --app-dir server \
               --host 0.0.0.0 \
               --port ${JETLOG_PORT}"

if [ $(id -u) -eq 0 ] && [ $(id -g) -eq 0 ];
then
    #echo "Container running as root, setting permissions to ${PUID}:${PGID}..."
    echo "Container running as root..."
    #chown -R ${PUID}:${PGID} ${DATA_PATH}
    gosu ${PUID}:${PGID} ${start_command}
else
    echo "Container running as $(id -u):$(id -g)..."
    ${start_command}
fi
