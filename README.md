# jetlog
<p align="center">
    <img src="https://img.shields.io/docker/pulls/pbogre/jetlog?style=for-the-badge" />
    <img src="https://img.shields.io/docker/image-size/pbogre/jetlog?style=for-the-badge" />
</p>

A self-hostable personal flight tracker and viewer

![homepage preview](images/homepage.png)|![all flights preview](images/all-flights.png)
:--------------------------------------:|:---------------------------------------------:



## features

- 🌍 World map view of all visited airports and trajectories of flights
- 📊 Statistics for all your flights
- 📱 (semi-)Responsive design
- 👨‍💻 Sleek and intuitive UI
- ✅ Effortlessly add, edit, and delete past flights

## installation

### docker (recommended)

Use the sample `docker-compose.yml` from the repo or make your own.

Make sure to add a volume from your data path to `/data` and populate the directory with the contents from the [`data directory`](https://github.com/pbogre/jetlog/tree/main/data).

Remember the container is required to run on port `3000`.

### manual (development)

1. Clone the repository and `cd` to it
2. Install npm dependencies and build frontend
    ```
    npm ci
    npm run build
    ```
3. Install pipfile dependencies with pipenv
    ```
    pip install pipenv
    pipenv install
    ```
4. Open the virtual shell and start the server
    ```
    pipenv shell
    (jetlog) python -m uvicorn main:app --app-dir server --host 0.0.0.0 --port 3000
    ```
5. All done, you can open `http://localhost:3000` on your browser to view jetlog running

## stack

- [FastAPI](https://fastapi.tiangolo.com/)
- [SQLite](https://www.sqlite.org/)
- [React](https://react.dev/)
- [TailwindCSS](https://tailwindcss.com/)
- [Airports database](https://github.com/jpatokal/openflights/)
- [react-simple-map](https://www.react-simple-maps.io/)
- [World GeoJSON](https://geojson-maps.kyd.au/)
