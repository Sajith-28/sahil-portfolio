"""
Database connection module for Sahil Ahamed's Portfolio.
Uses Motor (async MongoDB driver) with MongoDB Atlas.
Gracefully handles missing/failed connections so the app
can still serve static frontend content.
"""

import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI: str = os.getenv("MONGODB_URI", "")
DB_NAME: str = os.getenv("DB_NAME", "sahil_portfolio")


class Database:
    """Singleton-style container for the async MongoDB client and database."""

    client: AsyncIOMotorClient | None = None
    db = None


# Module-level instance shared across the application
database = Database()


async def connect_db() -> None:
    """
    Open a connection to MongoDB Atlas and verify it with a ping.
    If the URI is empty or the server is unreachable the app continues
    without database functionality.
    """
    if not MONGODB_URI:
        print("[Warning] MONGODB_URI not set – running without database functionality")
        return

    try:
        database.client = AsyncIOMotorClient(MONGODB_URI)
        database.db = database.client[DB_NAME]
        # Verify the connection is alive
        await database.client.admin.command("ping")
        print("[Success] Connected to MongoDB Atlas")
    except Exception as e:
        print(f"[Warning] MongoDB connection failed: {e}")
        print("   App will run without database functionality")
        database.client = None
        database.db = None


async def close_db() -> None:
    """Cleanly close the MongoDB connection if one exists."""
    if database.client:
        database.client.close()
        print("[Info] MongoDB connection closed")


def get_db():
    """Return the current database handle (may be None)."""
    return database.db
