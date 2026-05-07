# Research & Technical Decisions

**Feature**: 007-fix-ui-permissions

## Technical Context Unknowns

There were no `NEEDS CLARIFICATION` items identified in the Technical Context. The implementation relies entirely on existing frameworks (React, Tailwind CSS, FastAPI) and architectural patterns already established in the codebase.

## Technology Choices

1. **Role-based UI Conditional Rendering**
   - **Decision**: Use existing React state/context for the current user's role to conditionally render elements.
   - **Rationale**: Standard React pattern for hiding/showing elements based on user permissions.

2. **API Endpoint Blocking**
   - **Decision**: Add role-based validation to the FastAPI endpoint for "gerar perguntas" to return a 403 Forbidden for Admin users.
   - **Rationale**: Adheres to the "Security by Design" principle in the constitution, preventing circumvention of the UI restrictions.

3. **Markdown Text Formatting**
   - **Decision**: Use a simple regex replacement or existing Markdown parser (if already present in the UI) to convert `*texto*` to bold `<b>texto</b>` or `<strong>texto</strong>`.
   - **Rationale**: The user specifically requested a single asterisk for bold text, which might require a custom regex if the default markdown parser interprets it as italic.

## Dependencies

No new dependencies are required for this feature.
