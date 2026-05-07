# API Contracts: Auth & Invitations

## Invitation Management

### POST `/invitations`
Generates a new invitation link.
- **Access**: SUPERADMIN, ADMIN, USUARIO_ADMIN (with scope restrictions)
- **Request**:
  ```json
  {
    "target_role": "USUARIO",
    "expires_in_hours": 24
  }
  ```
- **Response** (201 Created):
  ```json
  {
    "token": "uuid-token",
    "url": "http://domain.com/register?token=uuid-token",
    "expires_at": "2026-05-07T..."
  }
  ```

### GET `/invitations/{token}`
Validates a token before showing the registration form.
- **Response** (200 OK):
  ```json
  {
    "target_role": "USUARIO",
    "status": "valid"
  }
  ```

## User Registration

### POST `/register`
Registers a new user using a valid token.
- **Request**:
  ```json
  {
    "token": "uuid-token",
    "name": "Full Name",
    "email": "user@email.com",
    "password": "strongpassword"
  }
  ```
- **Response** (201 Created):
  ```json
  {
    "id": 123,
    "email": "user@email.com",
    "role": "USUARIO"
  }
  ```
