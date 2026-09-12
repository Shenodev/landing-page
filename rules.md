# OpenCode Execution Rules

## 1. Autonomous Execution & Skills
- **Skill Auditing:** Before executing any task, audit your available skills. If you lack a framework-specific skill (e.g., Next.js, Expo, Electron, Spline), you MUST autonomously use the `find-skills` tool to search and install it silently.
- **No Copy-Paste:** Never output raw code blocks for the user to manually copy-paste. You must use your File System skills to directly read, create, edit, and save files in the workspace.

## 2. Coding Standards
- Use TypeScript strictly. No `any` types.
- For React/Next.js, always use functional components with arrow functions.
- If an error occurs, do not ask for permission to fix it. Analyze the terminal output, apply the fix to the file, and restart the process automatically.

## 3. Context Awareness
- Always read `ARCHITECTURE.md` and `agentsroles.md` before making structural changes.

## 4. Test-Driven Development (TDD) Protocol
- **Backend & Logic First:** Before implementing any new API route, database schema, or core business logic, you MUST write automated tests (using Jest/Supertest) first.
- **The Execution Loop:**
  1. **Write Test:** Write a test for the requested feature.
  2. **Run Test:** Run it (it should fail).
  3. **Write Code:** Write the minimal code required to make the test pass.
  4. **Verify:** Run the test again. Do not proceed to UI integration or the next task until the test turns green.
- **UI Exception:** For purely visual elements (Tailwind CSS, Spline 3D), skip automated testing. Instead, focus on robust error boundaries and unhandled exception logging.