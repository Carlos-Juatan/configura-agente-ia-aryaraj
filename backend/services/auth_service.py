from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from models import InvitationModel, UserRole
from datetime import datetime, timedelta
import uuid
import logging

logger = logging.getLogger(__name__)

class AuthService:
    @staticmethod
    async def create_invitation(db: AsyncSession, target_role: str, created_by_id: int, expires_in_hours: int = 24) -> InvitationModel:
        """
        Cria um novo convite com um token único.
        """
        token = str(uuid.uuid4())
        expires_at = datetime.utcnow() + timedelta(hours=expires_in_hours)
        
        new_invite = InvitationModel(
            token=token,
            target_role=target_role,
            created_by_id=created_by_id,
            expires_at=expires_at,
            is_revoked=False
        )
        
        db.add(new_invite)
        await db.commit()
        await db.refresh(new_invite)
        
        logger.info(f"INVITATION: Token {token} created for role {target_role} by user {created_by_id}.")
        return new_invite

    @staticmethod
    async def validate_token(db: AsyncSession, token: str) -> InvitationModel:
        """
        Valida se um token é existente, não usado, não revogado e não expirado.
        """
        result = await db.execute(
            select(InvitationModel).where(
                InvitationModel.token == token,
                InvitationModel.used_at == None,
                InvitationModel.is_revoked == False
            )
        )
        invite = result.scalars().first()
        
        if not invite:
            logger.warning(f"INVITATION: Invalid token attempt: {token}")
            return None
            
        if invite.expires_at < datetime.utcnow():
            logger.warning(f"INVITATION: Expired token attempt: {token}")
            return None
            
        return invite

    @staticmethod
    async def mark_invitation_as_used(db: AsyncSession, token: str):
        """
        Marca o convite como utilizado.
        """
        result = await db.execute(select(InvitationModel).where(InvitationModel.token == token))
        invite = result.scalars().first()
        if invite:
            invite.used_at = datetime.utcnow()
            await db.commit()
            logger.info(f"INVITATION: Token {token} marked as used.")
