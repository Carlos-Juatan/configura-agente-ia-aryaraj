# Research: Doubt Inbox Reliability and Compatibility

## Decision 1: Protocol Compliance for Tool Calling
- **Finding**: Gemini and other OpenAI-compatible providers require a strict message sequence: `user` -> `assistant (tool_calls)` -> `tool` -> `assistant (content)`.
- **Decision**: Remove the intermediate `user` role message that was being injected after tool outputs.
- **Rationale**: The injected user message (`"A ferramenta retornou os dados acima..."`) breaks the required sequence and causes errors or confusion in strict models like Gemini. The model is capable of generating a final response by seeing the tool output directly in the message history.

## Decision 2: Prompt Instruction Prominence
- **Finding**: Instructions at the very end of a long system prompt can sometimes be ignored or given lower attention (recency bias vs primacy bias).
- **Decision**: Refactor prompt injection to ensure the "Doubt Inbox Protocol" is clearly separated and highlighted. Ensure instructions are added even if the tool was manually selected by the user.
- **Rationale**: Consolidating the instruction logic ensures consistency. Highlighting it with emojis and clear sections helps the model prioritize it when it lacks information.

## Decision 3: Context Capture Optimization
- **Finding**: Capturing only the last 5 messages might miss the initial question if the conversation is "noisy" or if tool calls take up turns.
- **Decision**: Capture the last 8-10 messages, filtering out internal tool outputs if necessary to focus on the User/Assistant exchange.
- **Rationale**: Better context helps the administrator understand *why* the agent failed and what the user was actually looking for.

## Decision 4: Async Session Handling
- **Finding**: Using `db.commit()` inside a nested tool handler can sometimes lead to session state issues if not handled carefully in an async environment.
- **Decision**: Ensure the `db` session is correctly managed and that any exceptions in the tool handler are logged without crashing the main loop.
- **Rationale**: Reliability of the persistence layer is critical.
