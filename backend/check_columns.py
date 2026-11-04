
import asyncio
from sqlalchemy import text
from app.db.database import engine


async def main():
    async with engine.connect() as conn:
        result = await conn.execute(
            text("""
                SELECT column_name, data_type
                FROM information_schema.columns
                WHERE table_name = 'hackathons'
                AND column_name IN (
                    'hackathon_start',
                    'hackathon_end'
                )
                ORDER BY column_name;
            """)
        )

        rows = result.fetchall()

        if not rows:
            print("Neither timestamp column exists.")
        else:
            for row in rows:
                print(row)

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
