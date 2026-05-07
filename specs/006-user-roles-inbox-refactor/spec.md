# Feature Specification: Enhanced User Roles, Permissions and Navigation Refactor

**Feature Branch**: `006-user-roles-inbox-refactor`  
**Created**: 2026-05-06  
**Status**: Draft  
**Input**: User description: "tela do banco de dados tem uma aba para as perguntas frequentes (inbox de dúvidas) vamos mudar essa aba para o menu lateral e vamos atualizar o sistema de usuários, vamos ter o superadmin que consegue gerenciar tudo e remover admins e usuários normais, o admin que não vai poder remover nem adicionar nem o super admin nem outros admins mas vai poder adicionar/remover novos usuários, e em relação ao usuários vão ser 2 o usuário admin que vai poder adicionar e remover usuários e o usuário que não vai poder nem remover e nem adicionar outros. e em relação ao usuário admin e usuário eles vão ter acesso limitado ao sistema, eles terão acesso somente ao histórico de conversas do agente, podendo apagar ou iniciar uma nova conversa com o agente porém, não terá permissão de modificar o agente, a única thing que poderá fazer é ativar ou desativar o agente, o usuário comum, terá as mesma permissões que o usuário admin mas não poderá nem ativar nem desativar o agente, em relação ao banco de dados tanto o usuário como o usuário admin poderão visualizar o conteúdo do banco de dados, porém somente o usuário admin poderá modificar o conteúdo do banco de dados ou adicionar novos, porém a unica forma de adicionar novos seão apenas atravez do botão '✨ Adicionar Novo' que abre o modal de 'Novo Conhecimento' as outras formas não estarão viziveis para o ususário admin nem para o usuário e em relação ao inbox de dúvidas, vamos deixar ele disponível para todos, ambos poderão responder as dúvidas, porém, somente os usuários admins poderão remover as pergunstas não respondidas. Em relação a tela de adiministração de usuários todos vão poder acessar porém o sistema de adicionar novos admins/usuários não será manual, você poderá gerar um link de acesso para a pessoa se cadastrar no sistema, esse link será único e ficará disponível por 24h após a criação, após esse tempo o link será invalidado e a pessoa não poderá mais se cadastrar no sistema, e em relação ao super admin será um usuário que será criado na inicialização do sistema, porém ele poderá conseder o título de super admin a outros admins, assim como também poderá remover o título de super admin de outros admins, assim como também poderá remover o título de super admin de si mesmo contanto que já tenha nomeado outro super admin. [CLARIFICATION: Roles are SUPERADMIN/ADMIN (System Team) and USUARIO_ADMIN/USUARIO (Clients)]."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Multi-tier Role Hierarchy (Priority: P1)

The system distinguishes between **Team roles** (Superadmin, Admin) and **Client roles** (Usuario Admin, Usuario).

**Team Roles (Internal):**
- **Superadmin:** Full system control. Can promote Admins to Superadmin. Can manage all users.
- **Admin:** System maintenance. Can add/remove Client accounts (`USUARIO_ADMIN`, `USUARIO`). Cannot manage Team roles.

**Client Roles (External):**
- **Usuario Admin:** Power user client. Can add/remove other `USUARIO_ADMIN` and `USUARIO` accounts. Can promote `USUARIO` to `USUARIO_ADMIN` and demote `USUARIO_ADMIN` to `USUARIO` within their context. Cannot modify system settings.
- **Usuario:** Regular client user. No management permissions.

**Why this priority**: Core security and access control mechanism.
**Independent Test**: Log in as each role and verify that specific management buttons/actions are only available to authorized roles.

**Acceptance Scenarios**:
1. **Given** a Superadmin logged in, **When** viewing the user list, **Then** they can promote an Admin to Superadmin or demote themselves (if another Superadmin exists).
2. **Given** an Admin logged in, **When** attempting to manage users, **Then** they can add/remove `USUARIO_ADMIN` or `USUARIO` but cannot see or edit `SUPERADMIN` or other `ADMIN` accounts.
3. **Given** a `USUARIO_ADMIN` logged in, **When** managing users, **Then** they can add or remove `USUARIO_ADMIN` and `USUARIO` accounts, and use a modal to change roles between these two types.

---

### User Story 2 - Restricted Agent & Database Access (Priority: P1)

Admins and Users have limited access to the agent configuration but can interact with history and the knowledge base. Interface is simplified for Client roles.

**Why this priority**: Ensures that non-Superadmin users cannot break the core agent configuration while still allowing them to manage data.
**Independent Test**: Verify that Admins can toggle the agent but not edit its prompt/settings, and that Users can only view the agent state. Check visibility of restricted buttons.

**Acceptance Scenarios**:
1. **Given** a `USUARIO_ADMIN`, **When** viewing the agent card, **Then** the "Ver configuração" button is hidden.
2. **Given** a `USUARIO_ADMIN` or `USUARIO` in Chat, **Then** the "Editar prompt" button is hidden, and the "Tests" menu shows only messages, tokens, investment, and reset.
3. **Given** any Client role in the Database, **Then** the "Configurações" button on cards is hidden, and the "Identificação" tab in content view is missing.

---

### User Story 3 - Invitation-based Registration (Priority: P2)

New users (Admins or Users) are added via unique, time-limited invitation links instead of manual entry.

**Why this priority**: Streamlines user onboarding and improves security by removing direct "Add User" forms.
**Independent Test**: Generate a link, wait 24h, and verify it no longer works.

**Acceptance Scenarios**:
1. **Given** an authorized user (Superadmin or Admin), **When** they click "Add New User", **Then** the system generates a unique link valid for 24 hours.
2. **Given** a person with an expired link, **When** they try to access the registration page, **Then** they see an "Invalid or Expired Link" error.

---

### User Story 4 - Sidebar Navigation Refactor (Priority: P2)

The "Inbox" (FAQ/Doubts) is moved from a database tab to a top-level sidebar item.

**Why this priority**: Improves visibility and access to the frequently used FAQ feature.
**Independent Test**: Open the app and verify the "Inbox" icon is in the sidebar and the tab is gone from the Base de Conhecimento screen.

**Acceptance Scenarios**:
1. **Given** any user, **When** looking at the sidebar, **Then** the "Inbox" menu item is visible.
2. **Given** any user, **When** viewing the Base de Conhecimento screen, **Then** no "Inbox" tab is present.
3. **Given** an Admin, **When** in the Inbox, **Then** they can delete unanswered questions, whereas a User can only reply.

---

### Edge Cases

- **Self-Demotion**: A Superadmin tries to remove their own Superadmin status when they are the only one left (System must block this).
- **Link Expiry**: A user starts registration 1 minute before the 24h limit and submits after the limit (System should validate at submission).
- **Concurrency**: Two admins try to delete the same unanswered question at the same time.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST move the "Inbox/FAQ" component from the Base de Conhecimento screen tabs to the main Sidebar navigation.
- **FR-002**: System MUST implement four roles: `SUPERADMIN`, `ADMIN` (Team), `USUARIO_ADMIN`, and `USUARIO` (Clients).
- **FR-003**: Superadmin MUST be created automatically during system initialization (default credentials).
- **FR-004**: Superadmin MUST be able to grant `SUPERADMIN` status to `ADMIN` users.
- **FR-005**: Superadmin MUST NOT be able to revoke their own `SUPERADMIN` status unless at least one other `SUPERADMIN` exists in the system.
- **FR-006**: Admin MUST be able to add/remove Client role accounts (`USUARIO_ADMIN`, `USUARIO`) only.
- **FR-015**: `USUARIO_ADMIN` MUST be able to add/remove both `USUARIO_ADMIN` and `USUARIO` role accounts.
- **FR-007**: Client roles (`USUARIO_ADMIN`, `USUARIO`) MUST be restricted to "Conversation History" (view, delete, start new) and MUST NOT be able to modify core Agent configuration (prompt, model, tools). Team roles (`SUPERADMIN`, `ADMIN`) have full access to modify the Agent.
- **FR-014**: Team roles and `USUARIO_ADMIN` MUST have the permission to "Activate/Deactivate" the Agent, while `USUARIO` MUST NOT.
- **FR-009**: Database access for `USUARIO_ADMIN`: View, Edit, and "Add New".
- **FR-016**: System MUST hide all bulk import and advanced addition methods (CSV, API, etc.) for Client roles, leaving ONLY the "✨ Adicionar Novo" button visible for `USUARIO_ADMIN`.
- **FR-010**: Database access for `USUARIO`: View-only (no editing, no adding). All addition/import buttons MUST be hidden.
- **FR-011**: Inbox access: All roles can view and reply to questions.
- **FR-012**: Inbox cleanup: Only Team roles (`SUPERADMIN`, `ADMIN`) can delete questions that have not been answered.
- **FR-013**: User Creation: System MUST generate a unique, single-use registration link valid for 24 hours. Manual user creation forms MUST be removed for all management screens.
- **FR-017**: User Management MUST implement a unified "Promote/Demote" button that opens a modal to manage user roles. This action is available to `SUPERADMIN` (all roles) and `USUARIO_ADMIN` (for other `USUARIO_ADMIN` and `USUARIO` accounts).
- **FR-018**: The "Meus Agentes" screen MUST be refactored to a tabbed interface with two tabs: "Meus Agentes" and "Variáveis de Contexto Globais".
- **FR-019**: The "Variáveis de Contexto Globais" tab MUST ONLY be visible to `SUPERADMIN` and `ADMIN` roles. For `USUARIO_ADMIN` and `USUARIO`, the entire tab bar MUST be hidden, showing only the agents list.
- **FR-020**: System MUST hide the following buttons for Client roles (`USUARIO_ADMIN`, `USUARIO`): "Ver configuração" (Agent Card), "Editar prompt" (Chat), and "Configurações" (Database Card). These buttons remain visible for Team roles (`SUPERADMIN`, `ADMIN`).
- **FR-021**: System MUST simplify UI for Client roles:
    - Chat "Tests" menu: Show only Message Count, Tokens Spent, Investment, and Reset button.
    - Database Content View: Hide "Identificação" tab, showing only "Conteúdo" tab.
    - Team roles (`SUPERADMIN`, `ADMIN`) MUST continue to see full information and all tabs.

### Key Entities *(include if feature involves data)*

- **User**: Represents a system operator. Attributes: Name, Email, Role (SUPERADMIN, ADMIN, USUARIO_ADMIN, USUARIO), Active Status.
- **InvitationLink**: Represents a pending registration. Attributes: Unique Token, Target Role, CreatedAt, ExpiresAt, IsUsed.
- **InboxQuestion**: Represents a user doubt/FAQ item. Attributes: Question, Answer, Status (Answered/Unanswered), CreatedBy.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Navigation to the Inbox feature is reduced from 2-3 clicks (Database > Tab) to 1 click (Sidebar).
- **SC-002**: 100% of invitation links automatically invalidate and become unusable after 24 hours.
- **SC-003**: Client users (`USUARIO_ADMIN`, `USUARIO`) are 100% prevented from accessing the Agent configuration API or UI components for modification.
- **SC-004**: The system maintains at least one active Superadmin at all times via logic-level validation.
- **SC-005**: Registration page passes visual excellence check with an animated mesh/dynamic gradient background.

## Assumptions

- **Initial Superadmin**: The system will create the first Superadmin using credentials defined in environment variables (e.g., `INITIAL_SUPERADMIN_EMAIL`, `INITIAL_SUPERADMIN_PASSWORD`) on the first run.
- **Single-Tenant Deployment**: The system is installed on the client's own server; all users belong to the same organization.
- **Session Management**: Existing authentication (JWT or Session) will be updated to include the new role hierarchy.
- **UI Framework**: The current UI uses a sidebar and tab system that allows for easy migration of components.
- **Agent Modification**: "Modify the agent" refers to changing its system prompt, model settings, and connected tools.
- **Database "Other forms"**: Refers to bulk imports or CSV uploads which should be hidden for non-Team roles.

## Clarifications

### Session 2026-05-06
- Q: Can Admin (Team) modify agent configuration? → A: Yes, Team roles (Superadmin and Admin) have full access.
- Q: Is user management isolated by groups? → A: No, deployment is single-tenant; management is global for the instance.
- Q: How is the first Superadmin created? → A: Via credentials defined in the .env file.
- Q: What is the management scope for USUARIO_ADMIN? → A: Can invite both USUARIO_ADMIN and USUARIO.
- Q: What is the visual style for the registration page? → A: Dynamic background with animated gradients.
- Q: How to handle Knowledge Base addition buttons for clients? → A: Hide all advanced/bulk methods, only show "Adicionar Novo" for Usuario Admin.
- Q: By removing the "editar" button for all roles in User Management, should the Superadmin still have independent buttons to "Promote/Revoke" status? → A: Yes, dedicated buttons for these actions remain only for Superadmins.
- Q: How should the "Meus Agentes" screen behave for users without access to Global Variables? → A: The tab bar must be hidden entirely, displaying only the agents list.

### Session 2026-05-07
- Q: Who does the promotion power refer to in point 4? → A: To the **USUARIO_ADMIN (Client)** role, who can promote/demote between `USUARIO` and `USUARIO_ADMIN`.
- Q: Should configuration buttons be hidden for the Team? → A: No, they remain visible for `SUPERADMIN` and `ADMIN` (Team) and are hidden only for Clients (`USUARIO_ADMIN` and `USUARIO`).
- Q: Should interface simplifications (Tests menu and tabs) apply to everyone? → A: No, apply only to **Clients**. The Team continues to see full information and all tabs.
- Q: Should the promotion/demotion function be a single button? → A: Yes, a single button that opens a modal for these actions.
