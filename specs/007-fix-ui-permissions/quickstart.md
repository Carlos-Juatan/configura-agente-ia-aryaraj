# Quickstart: 007-fix-ui-permissions

## Overview
This feature introduces UI permission fixes and markdown formatting for chat messages.

## Implementation Steps

1. **Frontend (React)**:
   - Locate the Chat History component. Ensure filter tabs are hidden for both `admin` and `user` roles, displaying only the "Tudo" content.
   - For `admin` users, keep the "gerenciar conversas" button enabled. For `user`, hide it.
   - When an `admin` selects conversations, show only the "excluir" button and hide "gerar perguntas".
   - Locate the Agent Card component. For `admin` users, apply a full-width style (`w-full` in Tailwind) to the "Chat" button.
   - Locate the Sidebar component. Add a navigation link to "inbox de dúvidas" visible only for the `user` role.
   - In the message rendering component, update the markdown parsing logic to parse `*text*` as bold (`<strong>` or `<b>`) instead of italic.

2. **Backend (FastAPI)**:
   - Locate the endpoint responsible for generating questions.
   - Add a dependency or check to verify the current user's role.
   - If `role == 'admin'`, raise an `HTTPException(status_code=403, detail="Admins cannot generate questions.")`.
