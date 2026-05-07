---
description: "Task list for the Enhanced User Roles, Permissions and Navigation Refactor feature"
---

# Tasks: Enhanced User Roles, Permissions and Navigation Refactor

**Input**: Design documents from `/specs/006-user-roles-inbox-refactor/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api-schema.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and global configuration.

- [x] T001 Update `backend/main.py` to include `INITIAL_SUPERADMIN_EMAIL` and `INITIAL_SUPERADMIN_PASSWORD` (Provisioning logic already present, verify .env usage)
- [x] T002 [P] Create `frontend/src/constants/roles.js` with matching role strings

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented.

- [X] T003 Define role constants and create Alembic migration to update `users.role` check constraint in `backend/models/user.py` and `backend/alembic/versions/`
- [X] T004 Create `InvitationLinkModel` and migration for `invitation_links` table in `backend/models/invitation.py`
- [X] T005 [P] Implement `RoleChecker` dependency in `backend/api/dependencies.py` (Implemented in `main.py` as `check_role`)
- [X] T006 Implement basic `invitation_service.py` skeleton in `backend/services/invitation_service.py` (Implemented in `main.py`)
- [x] T007 [P] Create `frontend/src/hooks/useRole.js` for centralized role checks

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - Multi-tier Role Hierarchy (Priority: P1) 🎯 MVP

**Goal**: Implement the 4-tier role system and role management logic.

**Independent Test**: Log in as each role and verify that specific management buttons/actions are only available to authorized roles (e.g., Superadmin can see Promote button, Admin cannot).

### Implementation for User Story 1

- [X] T008 [P] [US1] Update `UserModel` to support new roles in `backend/models/user.py`
- [X] T009 [US1] Implement role management logic (promote/revoke) in `backend/services/user_service.py` (Implemented in `main.py`)
- [X] T010 [US1] Add logic-level validation to ensure at least one Superadmin remains (SC-004) in `backend/services/user_service.py` (Implemented in `main.py`)
- [X] T011 [US1] Create toggle-superadmin endpoint in `backend/api/routes/users.py` (Implemented as `PATCH /users/{user_id}/role`)
- [x] T012 [P] [US1] Refactor `frontend/src/components/UserManagement.jsx` to remove "Editar" button
- [x] T013 [US1] Implement "Promover" and "Revogar" buttons in `frontend/src/components/UserManagement.jsx` for Superadmins only
- [x] T014 [US1] Secure user management endpoints using `RoleChecker` in `backend/main.py`

**Checkpoint**: User Story 1 (Role Hierarchy) functional and testable.

---

## Phase 4: User Story 2 - Restricted Agent & Database Access (Priority: P1)

**Goal**: Isolate configuration and data modification from client roles.

**Independent Test**: Log in as `USUARIO` and verify that the "Meus Agentes" tab bar is hidden and Database "Edit/Add" buttons are gone.

### Implementation for User Story 2

- [x] T015 [P] [US2] Refactor `frontend/src/components/Dashboard.jsx` to implement tabbed interface for Global Context
- [x] T016 [US2] Implement tab bar hiding logic in `Dashboard.jsx` when only one tab is available (Client roles)
- [x] T017 [P] [US2] Hide advanced DB import/add buttons in `frontend/src/components/KnowledgeBaseManager.jsx` for client roles
- [x] T018 [US2] Add backend checks for agent modification to block `USUARIO_ADMIN` and `USUARIO` in `backend/main.py`
- [x] T019 [US2] Ensure only "Adicionar Novo" modal is accessible for `USUARIO_ADMIN` in `frontend/src/components/KnowledgeBaseManager.jsx`

**Checkpoint**: User Story 2 (Restricted Access) functional.

---

## Phase 5: User Story 4 - Sidebar Navigation Refactor (Priority: P2)

**Goal**: Move Inbox from Database tabs to Sidebar.

**Independent Test**: Verify "Inbox" icon in sidebar and absence of "Inbox" tab in Base de Conhecimento screen.

### Implementation for User Story 4

- [x] T020 [P] [US4] Remove "Inbox" tab from `frontend/src/components/KnowledgeBaseList.jsx`
- [x] T021 [US4] Add "Inbox" navigation item to `frontend/src/components/Sidebar.jsx` and restrict it to Management
- [x] T022 [US4] Verify standalone `UnansweredQuestions.jsx` access via `/inbox` route
- [x] T023 [P] [US4] Update sidebar icons and labels for consistency

**Checkpoint**: User Story 4 (Sidebar Navigation) functional.

---

## Phase 6: User Story 3 - Invitation-based Registration (Priority: P2)

**Goal**: Replace manual user creation with time-limited invitation links.

**Independent Test**: Generate a link as Admin, wait for expiry/use it, and verify link invalidation.

### Implementation for User Story 3

- [x] T024 [US3] Implement link generation and token validation in `backend/main.py`
- [x] T025 [US3] Create invitation and validation endpoints in `backend/main.py`
- [x] T026 [P] [US3] Create registration via token interface in `frontend/src/pages/Register.jsx`
- [x] T027 [US3] Implement registration logic in backend
- [x] T028 [US3] Update "Adicionar Usuário" button in `frontend/src/components/UserManagement.jsx` to handle invitations

**Checkpoint**: User Story 3 (Invitation Flow) functional.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final touches and verification.

- [x] T029 Implement premium styling for `frontend/src/pages/Register.jsx`
- [x] T030 [P] Verify role-based security across all modified components
- [x] T031 Perform final audit of "Edit" buttons visibility
- [x] T032 Verify Dashboard tab visibility logic for all 4 roles

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup (T001-T003).
- **User Stories (Phase 3-6)**: All depend on Foundational (Phase 2) completion.
- **Polish (Phase 7)**: Depends on all user stories.
