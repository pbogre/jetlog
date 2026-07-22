import os.path
from pathlib import Path
from fastapi import HTTPException

from server.models import FlightModel, User
from server.environment import DATA_PATH

# SQLAlchemy Core integration (keep API compatible with previous sqlite3 usage)
from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.exc import SQLAlchemyError

class Database():
    engine: Engine
    tables = {
        "flights": {
            "pragma": """
                (
                    id               INTEGER PRIMARY KEY AUTOINCREMENT,
                    username         TEXT NOT NULL DEFAULT admin,
                    date             TEXT NOT NULL,
                    origin           TEXT NOT NULL,
                    destination      TEXT NOT NULL,
                    departure_time   TEXT,
                    arrival_time     TEXT,
                    arrival_date     TEXT,
                    seat             TEXT NULL CHECK(seat IN ('aisle', 'middle', 'window')),
                    aircraft_side    TEXT NULL CHECK(aircraft_side IN ('left', 'right', 'center')),
                    ticket_class     TEXT NULL CHECK(ticket_class IN ('private', 'first', 'business', 'economy+', 'economy')),
                    purpose          TEXT NULL CHECK(purpose IN ('leisure', 'business', 'crew', 'other')),
                    duration         INTEGER,
                    distance         INTEGER,
                    airplane         TEXT,
                    airline          TEXT,
                    tail_number      TEXT,
                    flight_number    TEXT,
                    notes            TEXT,
                    connection       INTEGER NULL,
                    FOREIGN KEY (connection) REFERENCES flights (id) ON DELETE SET NULL,
                    CHECK (connection IS NULL OR connection <> id)
                )""",
            "model": FlightModel
        },
        "users": {
            "pragma": """
                (
                    id            INTEGER PRIMARY KEY AUTOINCREMENT,
                    username      TEXT NOT NULL UNIQUE COLLATE NOCASE,
                    password_hash TEXT NOT NULL,
                    is_admin      BIT NOT NULL DEFAULT 0,
                    last_login    DATETIME,
                    created_on    DATETIME NOT NULL DEFAULT current_timestamp
                )""",
            "model": User
        }
    }

    def __init__(self, db_dir: str):
        print("Initializing database connection (SQLAlchemy)")

        db_path = os.path.join(db_dir, "jetlog.db")

        # Create SQLAlchemy engine bound to the same SQLite file
        # check_same_thread=False to allow usage across FastAPI threads
        self.engine = create_engine(
            f"sqlite:///{db_path}",
            connect_args={"check_same_thread": False},
            future=True,
        )

        # Ensure foreign key constraints are enforced (SQLite off by default)
        @event.listens_for(self.engine, "connect")
        def _set_sqlite_pragma(dbapi_connection, connection_record):
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA foreign_keys = ON;")
            cursor.close()

        # Force-create the file if missing by making an initial connection
        if not os.path.isfile(db_path):
            print("Database file not found, creating it...")
            try:
                with self.engine.connect() as conn:
                    pass
            except Exception:
                print("Could not create database. Please check your volume's ownership")
                exit()

            try:
                self.initialize_tables()
            except HTTPException as e:
                print("Exception occurred while initializing tables: " + e.detail)
                os.remove(db_path)
                exit()
        else:
            # update airports and airlines tables
            self.update_tables()

            # verify that all tables are up-to-date (backward compatibility)
            for table in self.tables:
                table_info = self.execute_read_query(f"PRAGMA table_info({table});")
                column_names = [ col[1] for col in table_info ]

                table_pragma = self.tables[table]["pragma"]
                table_model = self.tables[table]["model"]

                if not column_names:
                    print(f"Missing table '{table}'. Creating it...")
                    self.execute_query(f"CREATE TABLE {table} {table_pragma};")

                    # if migrating to users update, also create the default user
                    if table == "users":
                        self.create_first_user()
                    continue

                needs_patch = False
                for key in table_model.get_attributes():
                    if key not in column_names:
                        print(f"Detected missing column '{key}' in table '{table}'. Scheduled a patch...")
                        needs_patch = True

                if needs_patch:
                    self.patch_table(table, column_names)

        print("Database initialization complete")
 
    def initialize_tables(self):
        for table in self.tables:
            table_pragma = self.tables[table]["pragma"]
            self.execute_query(f"CREATE TABLE {table} {table_pragma};")

        self.create_first_user()
        self.update_tables(drop_old=False)

    def create_first_user(self):
        from server.auth.utils import hash_password

        print("Creating first user admin:admin...")
        print("REMEMBER TO CHANGE THE DEFAULT PASSWORD FOR THIS USER!!!")

        default_username = "admin"
        default_password = hash_password("admin")
        self.execute_query("INSERT INTO users (username, password_hash, is_admin) VALUES (?, ?, 1);",
                           [default_username, default_password])

    def update_tables(self, drop_old: bool = True):
        print("Updating airports and airlines tables...")
        airports_db_path = Path(__file__).parent.parent / 'data' / 'airports.db'
        airlines_db_path = Path(__file__).parent.parent / 'data' / 'airlines.db'

        # Perform schema (DROP/CREATE) in a transaction, then ATTACH/COPY/DETACH
        from sqlalchemy.exc import SQLAlchemyError
        try:
            # First do DROP/CREATE inside a transaction
            with self.engine.begin() as conn:
                if drop_old:
                    try:
                        conn.exec_driver_sql("DROP TABLE airports;")
                    except SQLAlchemyError:
                        pass
                    try:
                        conn.exec_driver_sql("DROP TABLE airlines;")
                    except SQLAlchemyError:
                        pass

                conn.exec_driver_sql("""
                CREATE TABLE airports (
                    icao         TEXT PRIMARY KEY,
                    iata         TEXT,
                    type         TEXT,
                    name         TEXT,
                    municipality TEXT,
                    region       TEXT,
                    country      TEXT,
                    continent    TEXT,
                    latitude     FLOAT,
                    longitude    FLOAT,
                    timezone     TEXT
                );""")

                conn.exec_driver_sql("""
                CREATE TABLE airlines (
                    icao TEXT PRIMARY KEY,
                    iata TEXT,
                    name TEXT
                );""")

            # Then do ATTACH/COPY/DETACH in autocommit mode to avoid lock issues
            with self.engine.connect() as conn_plain:
                conn = conn_plain.execution_options(isolation_level="AUTOCOMMIT")
                conn.exec_driver_sql(f"ATTACH '{airports_db_path}' AS ap;")
                conn.exec_driver_sql(f"ATTACH '{airlines_db_path}' AS ar;")

                conn.exec_driver_sql("INSERT INTO main.airports SELECT * FROM ap.airports;")
                conn.exec_driver_sql("INSERT INTO main.airlines SELECT * FROM ar.airlines;")

                conn.exec_driver_sql("DETACH ap;")
                conn.exec_driver_sql("DETACH ar;")
        except SQLAlchemyError as err:
            raise HTTPException(status_code=500, detail="SQL error: " + str(err))

    def patch_table(self, table: str, present: list[str]):
        print(f"Patching table '{table}'...")

        table_pragma = self.tables[table]["pragma"]

        self.execute_query(f"DROP TABLE IF EXISTS _{table};")
        self.execute_query(f"CREATE TABLE _{table} {table_pragma};")
        self.execute_query(f"INSERT INTO _{table} ({', '.join(present)}) SELECT * FROM {table};")
        self.execute_query(f"DROP TABLE {table};")
        self.execute_query(f"ALTER TABLE _{table} RENAME TO {table};")

    def execute_query(self, query: str, parameters=[]) -> tuple:
        """Execute a write query and return a single row (e.g., RETURNING) or empty tuple.
        Keeps the previous API behavior while using SQLAlchemy under the hood.
        """
        params = tuple(parameters) if isinstance(parameters, (list, tuple)) else parameters
        try:
            with self.engine.begin() as conn:
                result = conn.exec_driver_sql(query, params)
                row = result.fetchone() if getattr(result, "returns_rows", False) else None
        except SQLAlchemyError as err:
            raise HTTPException(status_code=500, detail="SQL error: " + str(err))

        return tuple(row) if row else ()

    def execute_read_query(self, query: str, parameters=[]) -> list:
        params = tuple(parameters) if isinstance(parameters, (list, tuple)) else parameters
        try:
            with self.engine.connect() as conn:
                result = conn.exec_driver_sql(query, params)
                rows = result.fetchall()
                return [tuple(r) for r in rows]
        except SQLAlchemyError as err:
            raise HTTPException(status_code=500, detail="SQL error: " + str(err))

database = Database(DATA_PATH)
