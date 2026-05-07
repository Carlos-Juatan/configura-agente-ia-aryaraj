# API Contracts: User Roles and Invitations

## Invitation Endpoints

### POST /api/v1/invitations
Generates a new invitation token.

**Auth Required**: `SUPERADMIN`, `ADMIN`, or `USUARIO_ADMIN`

**Request Body**:
```json
{
  "target_role": "USUARIO_ADMIN"
}
```

**Response (201 Created)**:
```json
{
  "token": "a1b2c3d4-e5f6...",
  "invite_url": "https://seu-sistema.com/register?token=a1b2c3d4-e5f6...",
  "expires_at": "2026-05-07T10:30:00Z"
}
```

---

### GET /api/v1/invitations/{token}
Validates an invitation token before showing the registration form.

**Auth Required**: None

**Response (200 OK)**:
```json
{
  "is_valid": true,
  "target_role": "USUARIO_ADMIN"
}
```

---

### POST /api/v1/invitations/register
Creates a new user using a valid invitation token.

**Auth Required**: None

**Request Body**:
```json
{
  "token": "a1b2c3d4-e5f6...",
  "full_name": "João Silva",
  "password": "senha_segura_123"
}
```

**Response (201 Created)**:
```json
{
  "id": "u1v2w3x4...",
  "email": "joao@cliente.com",
  "role": "USUARIO_ADMIN"
}
```

## Management Endpoints

### PATCH /api/v1/users/{user_id}/role
Promotes or demotes a user.

**Auth Required**: `SUPERADMIN`

**Request Body**:
```json
{
  "new_role": "SUPERADMIN"
}
```

**Note**: System must validate that at least one other `SUPERADMIN` exists if a user is demoting themselves.
