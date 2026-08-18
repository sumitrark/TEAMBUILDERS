import asyncio

from sqlalchemy import select

from app.db.database import AsyncSessionLocal
from app.models.hackathon import Hackathon


async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Hackathon).order_by(Hackathon.created_at)

        )

        hackathons = result.scalars().all()

        print("\n========== EXISTING HACKATHONS ==========")

        if not hackathons:
            print("No hackathons found.")

        for hackathon in hackathons:
            print(f"ID         : {hackathon.id}")
            print(f"Title      : {hackathon.title}")
            print(f"Organizer  : {hackathon.organizer}")
            print(f"Start Date : {hackathon.start_date}")
            print(f"End Date   : {hackathon.end_date}")
            print(f"Team Size  : {hackathon.team_size}")
            print("----------------------------------------")


if __name__ == "__main__":
    asyncio.run(main())