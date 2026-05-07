# Research: User Roles, Permissions and Navigation Refactor

## Decision: Secure Invitation Links
- **Decision**: Use the Python `secrets` module to generate a URL-safe token (32 bytes) stored in a new `invitation_links` table.
- **Rationale**: Provides high entropy and cryptographically secure tokens. Storing them in the DB allows for easy expiration tracking (24h) and single-use validation (`is_used` flag).
- **Alternatives considered**: 
    - JWT-based links: Rejected because revoking a single JWT link before expiry is harder than a DB-backed token.

## Decision: React Tabbed Interface for Agents
- **Decision**: Create a generic `TabContainer` component in the frontend that takes a `tabs` array. Each tab object will have a `minRole` property.
- **Rationale**: Centralizes permission logic and ensures that if a user only has access to one tab, the entire tab bar is hidden as per the clarification decision.
- **Alternatives considered**: 
    - Hardcoded tabs in `MeusAgentes.jsx`: Rejected as it leads to duplicated role checking logic.

## Decision: Role-Based Dependency Injection (FastAPI)
- **Decision**: Implement a `RoleChecker` dependency class that takes a list of allowed roles.
- **Rationale**: Cleanest way to protect backend endpoints. e.g., `@app.get("/config", dependencies=[Depends(RoleChecker(["SUPERADMIN", "ADMIN"]))])`.
- **Alternatives considered**: 
    - Manual role check inside every route: Rejected for maintainability.

## Decision: Database Role Migration
- **Decision**: Update the existing `role` column in the `users` table to use a string-based role system with specific constants.
- **Rationale**: More flexible than SQL enums for single-tenant systems where roles might evolve.
- **Alternatives considered**: 
    - PostgreSQL Enum type: Rejected because changing enum values in a migration is more complex than updating a check constraint.
