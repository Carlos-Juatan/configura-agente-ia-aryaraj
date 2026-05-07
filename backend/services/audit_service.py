from sqlalchemy.ext.asyncio import AsyncSession
from models import AuditLogModel
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class AuditLogger:
    @staticmethod
    async def log(db: AsyncSession, action: str, details: dict, user_id: int = None, ip_address: str = None):
        """
        Registra uma ação no log de auditoria.
        """
        try:
            new_log = AuditLogModel(
                user_id=user_id,
                action=action,
                details=details,
                ip_address=ip_address,
                timestamp=datetime.utcnow()
            )
            db.add(new_log)
            await db.commit()
            logger.info(f"AUDIT: Action '{action}' by user {user_id} logged.")
        except Exception as e:
            logger.error(f"AUDIT: Failed to log action '{action}': {str(e)}")
            # N├úo lançamos exceção para n├úo quebrar o fluxo principal se a auditoria falhar
