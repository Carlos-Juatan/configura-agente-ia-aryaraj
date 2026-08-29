# API Contract: Agent Management with Router Agent Support

**Feature Branch**: `012-add-router-agent`  
**Date**: 2026-08-29  
**Spec**: [specs/012-add-router-agent/spec.md](file:///mnt/D_DADOS/02_Projetos_Ativos/Vet_Manager/Projects/configura-agente-ia-aryaraj/specs/012-add-router-agent/spec.md)

---

## Endpoints Summary

| Endpoint | Method | Role Required | Description |
|---|---|---|---|
| `/agents` | `GET` | All Roles | List all agents (includes `agent_type`, `router_prompt`, `destinations`, `fallback_agent_id`) |
| `/agents/{agent_id}` | `GET` | All Roles | Fetch single agent details with full destination mapping |
| `/agents` | `POST` | ADMIN / SUPERADMIN | Create a new Standard or Router Agent |
| `/agents/{agent_id}` | `PUT` | ADMIN / SUPERADMIN | Update an existing agent configuration and destination mappings |
| `/agents/{agent_id}/destinations` | `POST` | ADMIN / SUPERADMIN | Update / sync destination agents for a Router Agent |

---

## Endpoint Details

### 1. `POST /agents` (Create Agent)

#### Request Body (Router Agent Example)
```json
{
  "name": "Roteador Atendimento Principal",
  "description": "Roteia mensagens de entrada para Vendas, Suporte ou Agendamento",
  "agent_type": "router",
  "model": "gpt-5.2",
  "is_active": true,
  "router_prompt": "Analise a mensagem do lead:\n- Se o assunto for compra, planos ou preços -> Vendas\n- Se for dúvida técnica ou problema -> Suporte\n- Se for marcar horário ou consulta -> Agendamento",
  "fallback_agent_id": 2,
  "destinations": [
    {
      "destination_agent_id": 2,
      "routing_instruction": "Mensagens de suporte técnico e problemas",
      "priority": 1
    },
    {
      "destination_agent_id": 3,
      "routing_instruction": "Mensagens sobre vendas, orçamento e contratação",
      "priority": 2
    },
    {
      "destination_agent_id": 4,
      "routing_instruction": "Mensagens solicitando agendamento de consultas",
      "priority": 3
    }
  ]
}
```

#### Response (201 Created)
```json
{
  "id": 10,
  "name": "Roteador Atendimento Principal",
  "description": "Roteia mensagens de entrada para Vendas, Suporte ou Agendamento",
  "agent_type": "router",
  "model": "gpt-5.2",
  "is_active": true,
  "system_prompt": "Você é um assistente útil e inteligente.",
  "router_prompt": "Analise a mensagem do lead:\n- Se o assunto for compra, planos ou preços -> Vendas\n- Se for dúvida técnica ou problema -> Suporte\n- Se for marcar horário ou consulta -> Agendamento",
  "fallback_agent_id": 2,
  "destinations": [
    {
      "id": 1,
      "destination_agent_id": 2,
      "destination_agent_name": "Agente de Suporte Técnico",
      "routing_instruction": "Mensagens de suporte técnico e problemas",
      "priority": 1
    },
    {
      "id": 2,
      "destination_agent_id": 3,
      "destination_agent_name": "Agente de Vendas Comercial",
      "routing_instruction": "Mensagens sobre vendas, orçamento e contratação",
      "priority": 2
    },
    {
      "id": 3,
      "destination_agent_id": 4,
      "destination_agent_name": "Agente de Agendamento Vet",
      "routing_instruction": "Mensagens solicitando agendamento de consultas",
      "priority": 3
    }
  ],
  "updated_at": "2026-08-29T12:00:00Z"
}
```

---

### 2. `PUT /agents/{agent_id}` (Update Agent)

#### Request Body
```json
{
  "name": "Roteador Atendimento Principal (Atualizado)",
  "agent_type": "router",
  "router_prompt": "Prompt atualizado...",
  "fallback_agent_id": 2,
  "destinations": [
    {
      "destination_agent_id": 2,
      "routing_instruction": "Suporte Técnico",
      "priority": 1
    },
    {
      "destination_agent_id": 3,
      "routing_instruction": "Vendas",
      "priority": 2
    }
  ]
}
```

---

### 3. Error Responses

#### Validation Error (400 Bad Request) - No Destinations
```json
{
  "detail": "Um Agente Roteador deve possuir pelo menos um agente de destino configurado antes de ser ativado."
}
```

#### Validation Error (400 Bad Request) - Self Reference
```json
{
  "detail": "Um Agente Roteador não pode ter a si mesmo como agente de destino ou fallback."
}
```
