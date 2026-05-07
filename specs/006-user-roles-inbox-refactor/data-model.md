# Data Model: Enhanced User Roles and Invitations

## Updated Entities

### User (Table: `users`)
Updated to include new role hierarchy.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | Integer | PK |
| `name` | String | User's full name |
| `email` | String | Unique, used for login |
| `password` | String | Bcrypt hash |
| `role` | String | `SUPERADMIN`, `ADMIN`, `USUARIO_ADMIN`, `USUARIO` |
| `status` | String | `ATIVO`, `INATIVO` |
| `created_at`| DateTime | Auto-now |

---

## New Entities

### InvitationLink (Table: `invitation_links`)
Stores tokens for new user registration.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | Integer | PK |
| `token` | String (Unique) | Secure random string |
| `target_role`| String | The role the user will get upon registration |
| `created_by` | Integer | FK to `users.id` |
| `expires_at` | DateTime | `created_at` + 24 hours |
| `is_used` | Boolean | Default: `False` |

---

## Relationships

- **User → InvitationLink**: One User (Admin/Superadmin) can create many invitation links.
- **Agent → Role**: Access to Agent config is filtered by Role (Team roles only).
