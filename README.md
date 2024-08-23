# jetlog

<p align="center">
    <img src="https://img.shields.io/docker/pulls/pbogre/jetlog?style=for-the-badge" />
    <img src="https://img.shields.io/docker/image-size/pbogre/jetlog?style=for-the-badge" />
</p>

A self-hostable personal flight tracker and viewer

![homepage preview](images/homepage.png)|![all flights preview](images/all-flights.png)
:--------------------------------------:|:---------------------------------------------:

## Table of Contents

- [Features](#features)
- [Getting Started](#getting-started)
- [Importing & Exporting](#importing--exporting)
- [Stack](#stack)
- [Other credits](#other-credits)

## Features

- 🌍 World map view of all your flights
- 📊 Statistics for all your flights
- 📱 Responsive design
- ✅ Add, edit, and delete past flights
- 💾 Ability to import and export your data

Visit the [usage wiki](https://github.com/pbogre/jetlog/wiki/Usage) for details on all the features of Jetlog

## Getting Started

Here's a sample `docker-compose.yml` to get started
```yml
services:
  jetlog:
    image: pbogre/jetlog:latest
    volumes:
      - /your/data/path:/data
    restart: unless-stopped
    ports:
      - 3000:3000
```

For details about troubleshooting, environment variables, and more installation options, have a look at the [installation wiki](https://github.com/pbogre/jetlog/wiki/Installation)

## Importing & Exporting

You can currently import from the following formats

- MyFlightRadar24
- Custom CSV

You can currently export to the following formats

- CSV
- iCal

For details on how to import your data, have a look at the [importing wiki](https://github.com/pbogre/jetlog/wiki/Importing)

## Contributing

If you would like to contribute to this project by opening an issue or a pull request, 
please read [CONTRIBUTING.md](https://github.com/pbogre/jetlog/blob/main/CONTRIBUTING.md)

## Stack

- [FastAPI](https://fastapi.tiangolo.com/)
- [SQLite](https://www.sqlite.org/)
- [React](https://react.dev/)
- [TailwindCSS](https://tailwindcss.com/)

## Other credits

- [Favicon](https://www.flaticon.com/free-icon/flight_16863550?term=plane&page=1&position=36&origin=search&related_id=16863550)
- [Airports database](https://github.com/jpatokal/openflights/)
- [react-simple-map](https://www.react-simple-maps.io/)
- [World GeoJSON](https://geojson-maps.kyd.au/)

