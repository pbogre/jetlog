import sqlite3
import os.path
from pathlib import Path
from fastapi import HTTPException

from server.models import FlightModel
from server.environment import DATA_PATH

class Database():
    connection: sqlite3.Connection

    def __init__(self, db_dir: str):
        print("Initializing database connection")

        db_path = os.path.join(db_dir, "jetlog.db")

        if os.path.isfile(db_path):
            self.connection = sqlite3.connect(db_path)

            # verify that all fields are in the table
            # (backward compatibility)
            table_info = self.execute_read_query("PRAGMA table_info(flights);")
            column_names = [ col[1] for col in table_info ]

            needs_patch = False
            for key in FlightModel.get_attributes():
                if key not in column_names:
                    print(f"Detected missing column in flights table: '{key}'. Scheduling patch...")
                    needs_patch = True

            if needs_patch:
                self.patch_flights_table()

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
        airports_db_path = Path(__file__).parent.parent / 'data' / 'airports.db'
        
        self.execute_query("""
        CREATE TABLE flights (
            id             INTEGER PRIMARY KEY AUTOINCREMENT,
            date           TEXT NOT NULL,
            origin         TEXT NOT NULL,
            destination    TEXT NOT NULL,
            departure_time TEXT,
            arrival_time   TEXT, 
            seat           TEXT NULL CHECK(seat IN ('aisle', 'middle', 'window')),
            duration       INTEGER,
            distance       INTEGER,
            airplane       TEXT,
            flight_number  TEXT,
            notes          TEXT
        );""")

        self.execute_query("""
        CREATE TABLE airports (
            icao      TEXT,
            iata      TEXT,
            name      TEXT,
            city      TEXT,
            country   TEXT,
            latitude  FLOAT,
            longitude FLOAT
        );""")

        self.execute_query(f"ATTACH '{airports_db_path}' AS a;")
        self.execute_query("INSERT INTO main.airports SELECT * FROM a.airports;")
        self.execute_query("DETACH a;") 

    # columns that were not present in the base 
    # version of Jetlog must be added here for 
    # backward compatibility
    def patch_flights_table(self):
        print("Patching flights table...")
        self.execute_query("ALTER TABLE flights ADD flight_number TEXT;")
        self.execute_query("ALTER TABLE flights ADD notes TEXT;")

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
