# Quickstart: Testing Roles and Navigation

## Prerequisites
- Backend and Frontend services running.
- Initial Superadmin created via `.env` (check `INITIAL_SUPERADMIN_EMAIL`).

## Steps to Verify Feature

### 1. Sidebar Migration
- Log in with any account.
- Verify that the "Inbox" menu item appears directly in the sidebar.
- Go to "Base de Conhecimento" and verify that the "Inbox" tab is gone.

### 2. Tabbed Agent Management
- Log in as `SUPERADMIN`.
- Go to "Meus Agentes".
- Verify you see two tabs: "Meus Agentes" and "Variáveis de Contexto Globais".
- Log in as `USUARIO`.
- Go to "Meus Agentes".
- Verify the tab bar is hidden and you only see the agents list.

### 3. Invitation Flow
- As a Superadmin, go to "Gestão de Usuários".
- Click "Convidar Novo Usuário".
- Select a role (e.g., `ADMIN`) and generate the link.
- Open the link in an incognito window.
- Complete the registration and verify the new user has the correct role.

### 4. Role Restrictions (No Edit)
- In "Gestão de Usuários", verify that the "Editar" button is missing for all users.
- For Superadmin, verify that "Promover a Superadmin" (or Revogar) button is visible for other Admin users.
