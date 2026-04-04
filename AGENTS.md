<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

<!-- BEGIN BEADS INTEGRATION -->
## Issue Tracking with bd (beads)

**IMPORTANT**: This project uses **bd (beads)** for ALL issue tracking. Do NOT use markdown TODOs, task lists, or other tracking methods.

### Why bd?

- Dependency-aware: Track blockers and relationships between issues
- Git-friendly: Auto-syncs to JSONL for version control
- Agent-optimized: JSON output, ready work detection, discovered-from links
- Prevents duplicate tracking systems and confusion

### Quick Start

**Check for ready work:**

```bash
bd ready --json
```

**Create new issues:**

```bash
bd create "Issue title" --description="Detailed context" -t bug|feature|task -p 0-4 --json
bd create "Issue title" --description="What this issue is about" -p 1 --deps discovered-from:bd-123 --json
```

**Claim and update:**

```bash
bd update bd-42 --status in_progress --json
bd update bd-42 --priority 1 --json
```

**Complete work:**

```bash
bd close bd-42 --reason "Completed" --json
```

### Issue Types

- `bug` - Something broken
- `feature` - New functionality
- `task` - Work item (tests, docs, refactoring)
- `epic` - Large feature with subtasks
- `chore` - Maintenance (dependencies, tooling)

### Priorities

- `0` - Critical (security, data loss, broken builds)
- `1` - High (major features, important bugs)
- `2` - Medium (default, nice-to-have)
- `3` - Low (polish, optimization)
- `4` - Backlog (future ideas)

### Workflow for AI Agents

1. **Check ready work**: `bd ready` shows unblocked issues
2. **Claim your task**: `bd update <id> --status in_progress`
3. **Work on it**: Implement, test, document
4. **Discover new work?** Create linked issue:
   - `bd create "Found bug" --description="Details about what was found" -p 1 --deps discovered-from:<parent-id>`
5. **Complete**: `bd close <id> --reason "Done"`

### Auto-Sync

bd automatically syncs with git:

- Exports to `.beads/issues.jsonl` after changes (5s debounce)
- Imports from JSONL when newer (e.g., after `git pull`)
- No manual export/import needed!

### Important Rules

- ✅ Use bd for ALL task tracking
- ✅ Always use `--json` flag for programmatic use
- ✅ Link discovered work with `discovered-from` dependencies
- ✅ Use `bd vc status` / `bd vc commit` for Beads VC in this repository
- ✅ Check `bd ready` before asking "what should I work on?"
- ❌ Do NOT use `bd sync` as a sync step; it is deprecated
- ❌ Do NOT use `bd dolt pull/push` in this repository; `.beads/metadata.json` declares `dolt_mode: "server"`
- ❌ Do NOT create markdown TODO lists
- ❌ Do NOT use external issue trackers
- ❌ Do NOT duplicate tracking systems

For more details, see README.md and docs/agent/verification.md.

<!-- END BEADS INTEGRATION -->

## Search Playbook

Search order:

1. `mcp__claude_context__search_code`, if available in the current environment
2. `rg`
3. `rg --files`
4. Targeted file reads

Optional sidecar: `rlm-tools`

- Use `rlm-tools` only for low-context exploration when broad grep or file reads would dump too much raw text into the conversation.
- Treat `rlm-tools` output as exploratory evidence, not final proof. Confirm final facts with direct file evidence.
- Close exploration sessions with `rlm_end(session_id)` when finished.

Checklist:

1. Formulate the first query as `component + action + context`.
2. Keep the first pass narrow: `limit: 6-10` or equivalent scope.
3. Set `extensionFilter` early when semantic search is available:
   - Python backend and repo scripts: `.py`, `.sh`
   - Web app and Playwright coverage: `.ts`, `.tsx`, `.css`
   - Agent docs, specs, and runbooks: `.md`
4. Narrow scope early to `backend/`, `web/`, `scripts/`, `docs/agent/`, `openspec/`, `README.md`, and `AGENTS.md`.
5. Use the canonical repo root `/home/egor/code/change-control-center-ui/` for semantic indexing tools.
6. Confirm important implementation facts in at least two sources: code + test/spec/docs.
7. Do not treat plans, TODO/checklists, issue status, or OpenSpec task state as proof that behavior is implemented.
8. For OpenSpec-driven work, use [openspec/AGENTS.md](/home/egor/code/change-control-center-ui/openspec/AGENTS.md) as the authority and treat full-text search as fallback.

## UI verification contract

- Для UI-affecting и backend-served UI изменений используйте [docs/agent/verification.md](/home/egor/code/change-control-center-ui/docs/agent/verification.md) как канонический source of truth.
- Не придумывайте ad hoc smoke commands: `README.md`, agent instructions и helper automation должны ссылаться на один и тот же workflow.
- Frontend-only dev server не считается достаточным доказательством backend-served UI health.
- `npm run test:e2e` must not reuse an already running backend-served stack; default smoke path должен владеть backend lifecycle или падать fail-closed.
- Repo-owned local lifecycle для `dev`, `served` и Playwright `e2e` path должен идти через `bash ./scripts/ccc`, а не через новые inline shell fragments в docs или automation.

## UI skill routing

- Для UI-affecting запросов агент MUST proactively use matching UI-focused skills без отдельного понукания со стороны пользователя, если запрос явно соответствует профилю скилла.
- Каноническая матрица и порядок применения UI-скиллов живут в [docs/agent/ui-skills.md](/home/egor/code/change-control-center-ui/docs/agent/ui-skills.md).
- Базовая маршрутизация по умолчанию:
  - review, critique, "что не так", visual audit -> `critique`
  - живой прогон интерфейса в браузере, баг-хант, UX smoke -> `dogfood`
  - реализация нового UI или заметный редизайн -> `frontend-design`
  - слишком шумный, аляповатый или перегруженный интерфейс -> `quieter` и/или `distill`
  - responsive, compact-view, mobile, cross-viewport behavior -> `adapt`
  - overflow, empty/error states, i18n, edge-case resilience -> `harden`
  - финальный visual cleanup перед ship -> `polish`
  - более широкий standards/accessibility/performance review -> `audit` и/или `web-design-guidelines`
- Для существенных UI-изменений default sequence такой: `critique` -> `dogfood` -> `frontend-design` -> `adapt` -> `harden` -> `polish`; `audit` добавляется, когда нужен release-style quality pass.
- Если пользователь явно называет конкретный скилл, это имеет приоритет над дефолтной маршрутизацией.

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
   - Для UI-affecting и backend-served UI изменений сначала сверяйся с `docs/agent/verification.md` и используй его default smoke path как минимальный gate
   - Для изменений operator UI platform contract дополнительно запускай `cd web && npm run lint` и `cd web && npm run test:e2e:platform`
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd vc status
   bd vc commit -m "Describe beads changes"  # if `bd vc status` shows pending VC changes
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
