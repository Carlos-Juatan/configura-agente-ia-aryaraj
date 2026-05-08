
import asyncio
import os
from sqlalchemy import select, func
from database import async_session, init_db
from models import UnansweredQuestionModel

async def check_doubts():
    async with async_session() as session:
        result = await session.execute(select(func.count(UnansweredQuestionModel.id)))
        count = result.scalar()
        print(f"Total unanswered questions: {count}")
        
        result = await session.execute(select(UnansweredQuestionModel).limit(5))
        items = result.scalars().all()
        for item in items:
            print(f"ID: {item.id}, Status: {item.status}, Question: {item.question[:50]}...")

if __name__ == "__main__":
    asyncio.run(check_doubts())
