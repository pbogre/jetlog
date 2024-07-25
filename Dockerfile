# BUILD
ARG BUILD_PATH=/build
FROM --platform=$BUILDPLATFORM node:bullseye-slim AS build

ARG BUILD_PATH

RUN mkdir ${BUILD_PATH}
WORKDIR ${BUILD_PATH}

RUN apt update -y && apt upgrade -y
COPY package.json ./
RUN npm i --package-lock-only
RUN npm ci

COPY ./client ./client
COPY ./tailwind.config.js ./.postcssrc ./
RUN npm run build

# RUNTIME
FROM python:3.11-slim-bullseye
RUN apt update && apt install -y gosu && rm -rf /var/lib/apt/lists/*
RUN pip install pipenv


# environment variables
ENV PUID=1000
ENV PGID=1000
ENV APP_PATH=/app
ENV DATA_PATH=/data 

RUN mkdir -p ${APP_PATH}
RUN mkdir -p ${DATA_PATH}

WORKDIR ${APP_PATH}


# install python dependencies
COPY Pipfile Pipfile.lock ./
RUN pipenv install --system --deploy

COPY ./server ${APP_PATH}/server
COPY ./data ${APP_PATH}/data
COPY --from=build /build/dist ${APP_PATH}/dist

VOLUME ${DATA_PATH}
EXPOSE 3000/tcp

RUN chown ${PUID}:${PGID} ${APP_PATH}
RUN chown ${PUID}:${PGID} ${DATA_PATH}

COPY ./entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT [ "/entrypoint.sh" ]
