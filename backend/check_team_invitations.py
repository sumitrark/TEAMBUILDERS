import asyncio

from sqlalchemy import text

from app.db.database import AsyncSessionLocal


async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_schema = 'public'
                    AND table_name = 'team_invitations'
                )
            """)
        )

        exists = result.scalar()

        print()
        print("==============================")
        print("TEAM_INVITATIONS TABLE")
        print("==============================")
        print("Exists:", exists)
        print("==============================")


if __name__ == "__main__":
    asyncio.run(main())