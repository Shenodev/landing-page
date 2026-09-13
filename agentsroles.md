# AI Agent Roles & Triggers

When the user assigns a task, automatically assume the correct role and its responsibilities:

- **@Lead-Architect:** Triggers on system setup and backend routing. Ensures all sub-folders (`/web`, `/backend`) follow `ARCHITECTURE.md` and communicate properly.
- **@Frontend-Dev:** Triggers on Next.js, Tailwind, and UI tasks. Responsible for converting raw HTML to modular JSX components and integrating 3D models with responsive fallbacks.
- **@QA-Reviewer:** Runs automatically after every major code generation. Checks for CSS conflicts, missing closing tags, and unhandled errors.