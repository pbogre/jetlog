import sqlite3
import os.path
from fastapi import HTTPException

from server.environment import DATA_PATH

class Database():
    connection: sqlite3.Connection

    def __init__(self, db_dir: str):
        db_path = os.path.join(db_dir, "jetlog.db")

        if os.path.isfile(db_path):
            self.connection = sqlite3.connect(db_path)

        else:
            print("Database file not found, creating it...")
            self.connection = sqlite3.connect(db_path)

            try:
                self.initialize_tables()
            except HTTPException as e:
                if e.status_code == 500:
                    print("Exception occurred while initializing tables: " + e.detail)
                    os.remove(db_path)
   
    def initialize_tables(self):
        self.execute_query(
        """
        CREATE TABLE flights (
          id             INTEGER PRIMARY KEY AUTOINCREMENT,
          flight_number  TEXT,
          departed_from  TEXT NOT NULL,
          departure_date TEXT NOT NULL,
          departure_time TEXT,
          arrived_at     TEXT NOT NULL,
          arrival_date   TEXT, 
          arrival_time   TEXT, 
          seat           TEXT NULL CHECK(seat IN ('aisle', 'middle', 'window')),
          duration       INTEGER,
          airplane       TEXT
        );
        """)

    def execute_query(self, query: str, parameters=[]) -> int:
        try:
            print(query.replace('\n', '').replace('  ', ''))
            cursor = self.connection.cursor()
            cursor.execute(query, parameters)
            result = cursor.fetchone()
            self.connection.commit()

        except sqlite3.Error as err:
            raise HTTPException(status_code=500, detail="SQL error: " + str(err))

        if not result:
            raise HTTPException(status_code=400, detail="Query did not update/add an entry to the database")

        return result[0]

    def execute_read_query(self, query: str, parameters=[]) -> list:
        try:
            print(query.replace('\n', '').replace('  ', ''))
            cursor = self.connection.cursor()
            cursor.execute(query, parameters)
            result = cursor.fetchall()

            return result

        except sqlite3.Error as err:
            raise HTTPException(status_code=500, detail="SQL error: " + str(err))

database = Database(DATA_PATH)
