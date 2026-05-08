
import asyncio
import os
import json
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, func
from models import UnansweredQuestionModel, ToolModel, AgentConfigModel
from database import DATABASE_URL

# Manually create engine and session to avoid async_sessionmaker issue
engine = create_async_engine(DATABASE_URL)
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def check_system_state():
    async with async_session() as session:
        # Check tools
        result = await session.execute(select(ToolModel).where(ToolModel.name == 'registrar_duvida_sem_resposta'))
        tool = result.scalar_one_or_none()
        if tool:
            print(f"Tool 'registrar_duvida_sem_resposta' found in DB. ID: {tool.id}, Webhook: {tool.webhook_url}")
        else:
            print("Tool 'registrar_duvida_sem_resposta' NOT found in DB.")

        # Check agents
        result = await session.execute(select(AgentConfigModel).limit(10))
        agents = result.scalars().all()
        for agent in agents:
            print(f"Agent: {agent.name} (ID: {agent.id}), Inbox Capture: {agent.inbox_capture_enabled}")

if __name__ == "__main__":
    asyncio.run(check_system_state())
