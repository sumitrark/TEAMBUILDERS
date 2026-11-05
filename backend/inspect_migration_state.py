import asyncio
from sqlalchemy import text
from app.db.database import engine

async def main():
    async with engine.connect() as conn:
        for query in [
            "SELECT * FROM alembic_version",
            """
            SELECT conname, contype, pg_get_constraintdef(oid)
            FROM pg_constraint
            WHERE conrelid = 'team_messages'::regclass
            """,
            """
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name IN ('teams', 'users')
            """
        ]:
            result = await conn.execute(text(query))
            for row in result.fetchall():
                print(row)
            print("---")

    await engine.dispose()

asyncio.run(main())
