# BUILD
ARG BUILD_PATH=/build
FROM --platform=$BUILDPLATFORM node:bookworm-slim AS build

ARG BUILD_PATH

RUN mkdir ${BUILD_PATH}
WORKDIR ${BUILD_PATH}

RUN apt-get update -y && apt-get upgrade -y
COPY package.json ./
RUN npm config set registry https://registry.npmjs.org/
RUN npm i --package-lock-only
RUN npm ci

COPY ./client ./client
COPY ./tailwind.config.js ./.postcssrc ./
RUN npm run build

# RUNTIME
FROM python:3.11-slim-bookworm
RUN apt-get update -y && apt-get upgrade -y
RUN apt-get install -y gosu tini sqlite3 && rm -rf /var/lib/apt/lists/*
RUN pip install pipenv


# environment variables
ENV PUID=1000
ENV PGID=1000
ENV APP_PATH=/app
ENV DATA_PATH=/data 
ENV JETLOG_PORT=3000
ENV TOKEN_DURATION=7

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
EXPOSE ${JETLOG_PORT}/tcp

COPY ./entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/usr/bin/tini", "--", "/entrypoint.sh"]
