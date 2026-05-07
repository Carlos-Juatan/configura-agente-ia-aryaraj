# API Contracts: User Management & Registration

## Invitation Endpoints

### 1. Generate Invitation Link
Generates a unique link for a specific role.

- **URL**: `/api/auth/invite`
- **Method**: `POST`
- **Auth**: Required (`SUPERADMIN`, `ADMIN` or `USUARIO_ADMIN`)
- **Body**:
  ```json
  {
    "target_role": "USUARIO_ADMIN"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "invitation_url": "http://localhost:5173/register?token=abc123xyz...",
    "expires_at": "2026-05-07T16:24:49Z"
  }
  ```

---

### 2. Validate Token
Checks if a token is valid before showing the registration form.

- **URL**: `/api/auth/validate-token/{token}`
- **Method**: `GET`
- **Response (200 OK)**:
  ```json
  {
    "valid": true,
    "target_role": "USUARIO_ADMIN"
  }
  ```

---

### 3. Register with Token
Creates a new user using a valid token.

- **URL**: `/api/auth/register`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "token": "abc123xyz...",
    "name": "John Doe",
    "password": "secret_password"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "user_id": 42
  }
  ```

---

## Management Endpoints

### 4. Promote/Revoke Superadmin
Independent action for Superadmins.

- **URL**: `/api/users/{user_id}/toggle-superadmin`
- **Method**: `POST`
- **Auth**: Required (`SUPERADMIN`)
- **Response (200 OK)**:
  ```json
  {
    "new_role": "SUPERADMIN"
  }
  ```
