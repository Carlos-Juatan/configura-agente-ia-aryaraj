# API Contracts

**Feature**: 007-fix-ui-permissions

## Endpoints Modified

### `POST /api/questions/generate` (Example Endpoint)

This is an existing endpoint that will now enforce role-based access control.

**Authentication & Authorization**:
- Requires valid JWT token.
- **New Constraint**: User MUST NOT have the `admin` role. If an `admin` attempts to access this endpoint, it should return a `403 Forbidden` status code.

**Responses**:
- `200 OK`: Successful generation (for valid `user` roles).
- `403 Forbidden`: Returned when the authenticated user is an `admin`.
