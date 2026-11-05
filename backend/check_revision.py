import asyncio
from sqlalchemy import text
from app.db.database import engine

async def main():
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT version_num FROM alembic_version"))
        print("Database revision:", result.fetchall())
    await engine.dispose()

asyncio.run(main())
