import sqlite3
import os.path
from pathlib import Path
from fastapi import HTTPException

from server.models import FlightModel, User
from server.environment import DATA_PATH

class Database():
    connection: sqlite3.Connection
    tables = {
        "flights": {
            "pragma": """
                (
                    id             INTEGER PRIMARY KEY AUTOINCREMENT,
                    username       INTEGER NOT NULL DEFAULT admin,
                    date           TEXT NOT NULL,
                    origin         TEXT NOT NULL,
                    destination    TEXT NOT NULL,
                    departure_time TEXT,
                    arrival_time   TEXT,
                    arrival_date   TEXT,
                    seat           TEXT NULL CHECK(seat IN ('aisle', 'middle', 'window')),
                    ticket_class   TEXT NULL CHECK(ticket_class IN ('private', 'first', 'business', 'economy+', 'economy')),
                    duration       INTEGER,
                    distance       INTEGER,
                    airplane       TEXT,
                    flight_number  TEXT,
                    notes          TEXT
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
        print("Initializing database connection")

        db_path = os.path.join(db_dir, "jetlog.db")

        if os.path.isfile(db_path):
            self.connection = sqlite3.connect(db_path)

            # update airports table
            self.update_airports_table()

            # verify that all tables are up-to-date
            # (backward compatibility)
            for table in self.tables:
                table_info = self.execute_read_query(f"PRAGMA table_info({table});")
                column_names = [ col[1] for col in table_info ]

                table_pragma = self.tables[table]["pragma"]
                table_model = self.tables[table]["model"]

                if not column_names:
                    print(f"Missing table '{table}'. Creating it...")
                    self.execute_query(f"CREATE TABLE {table} {table_pragma};")

                    # if migrating to users update, also
                    # create the default user and assign
                    # all present flights to it
                    if table == "users":
                        self.create_first_user()

                    continue

                needs_patch = False
                for key in table_model.get_attributes():
                    if key not in column_names:
                        print(f"Detected missing column '{key}' in table '{table}. Scheduled a patch...")
                        needs_patch = True

                if needs_patch:
                    self.patch_table(table, column_names)

        else:
            print("Database file not found, creating it...")

            try:
                self.connection = sqlite3.connect(db_path)
            except:
                print(f"Could not create database. Please check your volume's ownership")
                exit()

            try:
                self.initialize_tables()
            except HTTPException as e:
                print("Exception occurred while initializing tables: " + e.detail)
                os.remove(db_path)
                exit()

        print("Database initialization complete")
 
    def initialize_tables(self):
        for table in self.tables:
            table_pragma = self.tables[table]["pragma"]
            self.execute_query(f"CREATE TABLE {table} {table_pragma};")

        self.create_first_user()
        self.update_airports_table(drop_old=False)

    def create_first_user(self):
        from server.auth.utils import hash_password

        print("Creating first user admin:admin...")
        print("REMEMBER TO CHANGE THE DEFAULT PASSWORD FOR THIS USER!!!")

        default_username = "admin"
        default_password = hash_password("admin")
        self.execute_query("INSERT INTO users (username, password_hash, is_admin) VALUES (?, ?, 1);",
                           [default_username, default_password])

    def update_airports_table(self, drop_old: bool = True):
        print("Updating airports table...")
        airports_db_path = Path(__file__).parent.parent / 'data' / 'airports.db'

        if drop_old:
            try:
                self.execute_query("DROP TABLE airports;")
            except: 
                # if airports database not found, simply skip deletion
                pass

        self.execute_query("""
        CREATE TABLE airports (
            icao         TEXT,
            iata         TEXT,
            type         TEXT,
            name         TEXT,
            municipality TEXT,
            region       TEXT,
            country      TEXT,
            continent    TEXT,
            latitude     FLOAT,
            longitude    FLOAT
        );""")

        self.execute_query(f"ATTACH '{airports_db_path}' AS a;")
        self.execute_query("INSERT INTO main.airports SELECT * FROM a.airports;")
        self.execute_query("DETACH a;") 

    def patch_table(self, table: str, present: list[str]):
        print(f"Patching table '{table}'...")

        table_pragma = self.tables[table]["pragma"]

        self.execute_query(f"CREATE TABLE _{table} {table_pragma};")
        self.execute_query(f"INSERT INTO _{table} ({', '.join(present)}) SELECT * FROM {table};")
        self.execute_query(f"DROP TABLE {table};")
        self.execute_query(f"ALTER TABLE _{table} RENAME TO {table};")

    def execute_query(self, query: str, parameters=[]) -> int:
        try:
            cursor = self.connection.cursor()
            cursor.execute(query, parameters)
            result = cursor.fetchone()
            self.connection.commit()

        except sqlite3.Error as err:
            raise HTTPException(status_code=500, detail="SQL error: " + str(err))

        return result[0] if result else -1

    def execute_read_query(self, query: str, parameters=[]) -> list:
        try:
            cursor = self.connection.cursor()
            cursor.execute(query, parameters)
            result = cursor.fetchall()

            return result

        except sqlite3.Error as err:
            raise HTTPException(status_code=500, detail="SQL error: " + str(err))

database = Database(DATA_PATH)
