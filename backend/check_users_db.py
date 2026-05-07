import asyncio
from sqlalchemy import select
from database import engine, async_session
from models import UserModel

async def check():
    async with async_session() as session:
        result = await session.execute(select(UserModel))
        users = result.scalars().all()
        for u in users:
            print(f"User: ID={u.id}, Email={u.email}, Role={u.role}")

if __name__ == '__main__':
    asyncio.run(check())
