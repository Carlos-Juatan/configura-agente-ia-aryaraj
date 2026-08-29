"""
Router Agent Classification Service (Feature 012)

Implements the core routing engine: evaluate_router_agent() receives the Router
Agent configuration plus the incoming message/history and uses a fast LLM call
(JSON output mode) to select the most appropriate destination agent.

Fallback policy (in priority order):
  1. Unmatched / low-confidence intent     → fallback_agent_id
  2. Selected destination is inactive      → fallback_agent_id
  3. Classification LLM timeout / error    → fallback_agent_id
  4. No fallback configured               → first active destination OR error notice
"""

import json
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

async def evaluate_router_agent(
    router_agent,           # AgentConfigModel ORM instance with .destinations loaded
    message: str,
    history: list,
    db_session,             # AsyncSession
) -> dict:
    """
    Classify the lead message against the Router Agent's destinations.

    Returns a dict with:
        selected_agent_id  (int | None)
        selected_agent_name (str | None)
        is_fallback        (bool)
        reasoning          (str)
        confidence         (float | None)
    """
    destinations = getattr(router_agent, "destinations", [])
    fallback_id = getattr(router_agent, "fallback_agent_id", None)
    router_prompt = getattr(router_agent, "router_prompt", "") or ""

    # -----------------------------------------------------------------------
    # Guard: no destinations configured
    # -----------------------------------------------------------------------
    if not destinations:
        return _make_fallback_result(
            fallback_id, None,
            "Agente Roteador sem destinos configurados. Roteamento para fallback."
        )

    # -----------------------------------------------------------------------
    # Load destination agent details from DB (name, is_active)
    # -----------------------------------------------------------------------
    try:
        dest_details = await _load_destination_details(destinations, db_session)
    except Exception as exc:
        logger.warning("router_service: failed to load destination details: %s", exc)
        dest_details = {}

    active_destinations = [
        d for d in destinations
        if dest_details.get(d.destination_agent_id, {}).get("is_active", True)
    ]

    if not active_destinations:
        return _make_fallback_result(
            fallback_id, dest_details,
            "Todos os agentes de destino estão inativos. Ativando fallback."
        )

    # -----------------------------------------------------------------------
    # Build the classification prompt
    # -----------------------------------------------------------------------
    dest_list_text = "\n".join([
        f"- Agent ID {d.destination_agent_id} "
        f"({dest_details.get(d.destination_agent_id, {}).get('name', 'Sem nome')}): "
        f"{d.routing_instruction or 'Sem instrução específica'}"
        for d in active_destinations
    ])

    # Summarise history context (last 3 exchanges max)
    history_summary = ""
    if history:
        recent = history[-6:]  # last 3 user+assistant pairs
        history_summary = "\n".join([
            f"{m.get('role', 'user').upper()}: {str(m.get('content', ''))[:300]}"
            for m in recent
            if isinstance(m.get("content"), str)
        ])

    system_prompt = f"""Você é um classificador de intenção de mensagens.
Sua única tarefa é analisar a mensagem recente de um lead e decidir para qual agente especialista ela deve ser roteada.

REGRAS DE ROTEAMENTO (definidas pelo gestor):
{router_prompt}

AGENTES DISPONÍVEIS:
{dest_list_text}

INSTRUÇÕES:
- Analise a mensagem e o histórico recente.
- Selecione o Agent ID mais adequado com base nas regras e descrições acima.
- Se a mensagem não corresponder claramente a nenhum agente, retorne null para selected_agent_id.
- Retorne APENAS um JSON válido com os campos: selected_agent_id, confidence, reasoning, is_fallback.

Exemplo de resposta:
{{"selected_agent_id": 4, "confidence": 0.92, "reasoning": "Usuário solicitou agendamento de consulta.", "is_fallback": false}}
"""

    # -----------------------------------------------------------------------
    # Classification LLM call
    # -----------------------------------------------------------------------
    try:
        classification = await _call_classifier_llm(
            system_prompt=system_prompt,
            message=message,
            history_summary=history_summary,
        )
    except Exception as exc:
        logger.warning("router_service: classifier LLM exception: %s", exc)
        return _make_fallback_result(
            fallback_id, dest_details,
            f"Exceção no serviço de classificação. Fallback ativado. Erro: {exc}"
        )

    selected_id = classification.get("selected_agent_id")
    is_fallback = classification.get("is_fallback", False)
    reasoning = classification.get("reasoning", "")
    confidence = classification.get("confidence")

    # -----------------------------------------------------------------------
    # Validate that the selected agent is active
    # -----------------------------------------------------------------------
    if selected_id is not None and not is_fallback:
        agent_info = dest_details.get(selected_id)
        if agent_info is None or not agent_info.get("is_active", True):
            logger.info(
                "router_service: selected agent %s is inactive, redirecting to fallback",
                selected_id
            )
            inactive_name = (agent_info or {}).get("name", str(selected_id))
            return _make_fallback_result(
                fallback_id, dest_details,
                f"Agente destino {selected_id} ({inactive_name}) está inativo. "
                f"Redirecionado para fallback."
            )

    # -----------------------------------------------------------------------
    # Unmatched intent → fallback
    # -----------------------------------------------------------------------
    if selected_id is None or is_fallback:
        return _make_fallback_result(
            fallback_id, dest_details,
            reasoning or "Intenção não correspondida. Fallback ativado."
        )

    # -----------------------------------------------------------------------
    # Happy path: return the selected agent
    # -----------------------------------------------------------------------
    selected_name = dest_details.get(selected_id, {}).get("name")
    return {
        "selected_agent_id": selected_id,
        "selected_agent_name": selected_name,
        "is_fallback": False,
        "reasoning": reasoning,
        "confidence": confidence,
    }


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_fallback_result(
    fallback_id: Optional[int],
    dest_details: Optional[dict],
    reasoning: str,
) -> dict:
    """Return a routing result that points to the fallback agent (or None if unconfigured)."""
    if fallback_id is not None:
        name = (dest_details or {}).get(fallback_id, {}).get("name") if dest_details else None
        return {
            "selected_agent_id": fallback_id,
            "selected_agent_name": name,
            "is_fallback": True,
            "reasoning": reasoning,
            "confidence": None,
        }

    # No fallback configured: try the first active destination from dest_details
    if dest_details:
        for agent_id, info in dest_details.items():
            if info.get("is_active", True):
                return {
                    "selected_agent_id": agent_id,
                    "selected_agent_name": info.get("name"),
                    "is_fallback": True,
                    "reasoning": reasoning + " (usando primeiro destino ativo como emergência)",
                    "confidence": None,
                }

    return {
        "selected_agent_id": None,
        "selected_agent_name": None,
        "is_fallback": True,
        "reasoning": reasoning + " Nenhum fallback configurado.",
        "confidence": None,
    }


async def _load_destination_details(destinations, db_session) -> dict:
    """Load {agent_id: {name, is_active}} for all destination agents from the DB."""
    if not destinations or not db_session:
        return {}

    from sqlalchemy import select
    from models import AgentConfigModel

    ids = [d.destination_agent_id for d in destinations]
    result = await db_session.execute(
        select(AgentConfigModel.id, AgentConfigModel.name, AgentConfigModel.is_active)
        .where(AgentConfigModel.id.in_(ids))
    )
    rows = result.all()
    return {row.id: {"name": row.name, "is_active": row.is_active} for row in rows}


async def _call_classifier_llm(
    system_prompt: str,
    message: str,
    history_summary: str,
) -> dict:
    """
    Fire a lightweight LLM call to classify the message.
    Returns parsed JSON dict. Raises on error.
    """
    import os
    from openai import AsyncOpenAI

    # Use gpt-4o-mini as the classification model (fast, cheap, reliable JSON)
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY not set — cannot run router classifier.")

    client = AsyncOpenAI(api_key=api_key)

    user_content = f"MENSAGEM DO LEAD: {message}"
    if history_summary:
        user_content = f"HISTÓRICO RECENTE:\n{history_summary}\n\n{user_content}"

    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content},
        ],
        response_format={"type": "json_object"},
        temperature=0.1,
        max_tokens=300,
        timeout=15,
    )

    raw = response.choices[0].message.content or "{}"
    result = json.loads(raw)
    logger.info("router_service: classifier returned %s", result)
    return result
