import asyncio
from sqlalchemy import text
from app.db.database import engine

async def main():
    async with engine.connect() as conn:
        queries = {
            "Tables": """
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name = 'team_messages'
            """,
            "Columns": """
                SELECT column_name, data_type
                FROM information_schema.columns
                WHERE table_schema = 'public'
                AND table_name = 'team_messages'
                ORDER BY ordinal_position
            """,
            "Indexes": """
                SELECT indexname, indexdef
                FROM pg_indexes
                WHERE schemaname = 'public'
                AND tablename = 'team_messages'
            """
        }

        for name, query in queries.items():
            result = await conn.execute(text(query))
            print(f"\n--- {name} ---")
            for row in result.fetchall():
                print(row)

    await engine.dispose()

asyncio.run(main())
