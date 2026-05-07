import asyncio
from sqlalchemy import text
from database import engine

async def check():
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"))
        tables = [r[0] for r in result.fetchall()]
        print(f"Tables: {tables}")
        
        if 'invitations' in tables:
            res = await conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'invitations'"))
            cols = [r[0] for r in res.fetchall()]
            print(f"Invitations columns: {cols}")
        else:
            print("Table 'invitations' NOT FOUND")

if __name__ == '__main__':
    asyncio.run(check())
