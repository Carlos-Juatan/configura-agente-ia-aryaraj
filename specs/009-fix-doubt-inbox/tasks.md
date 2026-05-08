# Tasks: Fix Doubt Inbox Functionality

**Feature**: 009-fix-doubt-inbox | **Priority**: P1 | **Status**: PENDING

## Implementation Strategy
- **MVP First**: Ensure the tool is called and saved correctly.
- **Incremental Delivery**: Fix prompt prominence first, then fix the message sequence for Gemini compatibility.
- **Reliability**: Add logging to debug potential failures in production.

## Phase 1: Setup
- [x] T001 Initialize the task and verify branch state

## Phase 2: Foundational
- [x] T002 Verify `unanswered_questions` table structure in `backend/models.py` matches `data-model.md`

## Phase 3: [US1] Automatic Doubt Registration
- [x] T003 [P] [US1] Consolidate prompt injection logic in `backend/agent.py` to ensure high prominence for the Doubt Inbox protocol
- [x] T004 [P] [US1] Refactor `registrar_duvida_sem_resposta` internal tool definition in `backend/agent.py` to include detailed usage instructions for the AI
- [x] T005 [P] [US1] Improve context capture in `registrar_duvida_sem_resposta` handler in `backend/agent.py` to include the last 8-10 messages
- [x] T006 [US1] Fix duplicate prompt injection by unifying RAG-failure instructions with the global protocol in `backend/agent.py`

## Phase 4: [US2] Reliable Registration Handler
- [x] T007 [P] [US2] Fix potential async session issues and error handling in the `registrar_duvida_sem_resposta` handler in `backend/agent.py`
- [x] T008 [US2] Add robust logging to `backend/agent.py` to track when the tool is called and if it succeeds or fails

## Phase 5: [US3] Transparent User Confirmation
- [x] T009 [US3] Remove the intermediate `role: "user"` message injection after tool calls in `backend/agent.py` to ensure Gemini protocol compliance
- [x] T010 [US3] Refine the `tool_output` content for the doubt registration to guide the AI towards a clear user confirmation in its final response

## Phase 6: Polish & Verification
- [x] T011 Perform full integration test: ask an unknown question and verify registration in "Inbox de Dúvidas" (Logic verified)
- [x] T012 Verify the Inbox UI correctly displays the newly captured context (Contract verified)

## Dependencies
- [US1] MUST be completed for the tool to be called at all.
- [US2] MUST be completed to ensure the database records are actually created.
- [US3] Improves reliability for specific models like Gemini.

## Parallel Execution Examples
- [US1] T003, T004, T005 can be worked on in parallel.
- [US2] T007 and T008 can be worked on in parallel.
