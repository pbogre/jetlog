import sqlite3
import os.path
from pathlib import Path
from fastapi import HTTPException

from server.environment import DATA_PATH

class AbstractDatabase():
    connection: sqlite3.Connection

    def __init__(self) -> None:
        pass

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

class Database(AbstractDatabase):
    def __init__(self, db_dir: str):
        db_path = os.path.join(db_dir, "jetlog.db")

        if os.path.isfile(db_path):
            self.connection = sqlite3.connect(db_path)

        else:
            print("Database file not found, creating it...")
            
            try:
                self.connection = sqlite3.connect(db_path)
            except Exception:
                print(f"Could not create database. Please check your volume's ownership")
                exit()

            try:
                self.initialize_tables()
            except HTTPException as e:
                print("Exception occurred while initializing tables: " + e.detail)
                os.remove(db_path)
   
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
            airplane       TEXT
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

database = Database(DATA_PATH)
