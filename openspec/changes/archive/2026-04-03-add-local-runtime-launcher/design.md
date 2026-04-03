## Context
The application foundation already exposes three real local execution shapes:
- `dev`: sidecar + backend reload + Vite
- `served`: sidecar + built `web/dist` + backend product entrypoint
- `e2e`: deterministic backend-served stack with a fake stdio runtime for Playwright smoke

Today those shapes are expressed as scattered raw commands. The launcher should make them explicit without changing backend ownership boundaries or the canonical smoke contract.

## Goals
- Provide one repo-owned lifecycle entrypoint for local stack operations.
- Keep `dev`, `served`, and `e2e` as distinct profiles with explicit ports and health checks.
- Remove duplicated startup shell fragments from docs and Playwright config.
- Fail closed when a required port is already occupied by an unmanaged process.

## Non-Goals
- Replace `npm run test:e2e` as the canonical smoke command.
- Add a process supervisor outside the repository.
- Change backend, sidecar, or Vite ports.

## Decisions
- Decision: Implement the launcher as Bash under `scripts/ccc`, with canonical invocation `bash ./scripts/ccc ...`.
  - Why: the repo already depends on shell entrypoints for local development, and Bash is the lightest way to manage PID files, logs, ports, and health probes without adding another runtime dependency.

- Decision: Store runtime state under `.run/ccc/<profile>/`.
  - Why: this keeps PID files, logs, and temporary launch metadata isolated from source files and makes `stop` safe and deterministic.

- Decision: Keep `build` explicit and separate from `start served`.
  - Why: the repository already treats the built web artifact as an explicit contract. `served` and `e2e` should fail clearly when the artifact is missing, while smoke continues to rebuild before browser automation through its own workflow.

- Decision: Make Playwright call the launcher for the `e2e` profile.
  - Why: browser smoke still runs through `npm run test:e2e`, but the executable lifecycle should live in one repo-owned entrypoint rather than an inline shell fragment.

## Risks
- Shell lifecycle code can become brittle if it relies on implicit environment state.
  - Mitigation: keep profiles explicit, record launch metadata, and add automated drift checks.

- Background process cleanup can leak if PID handling is sloppy.
  - Mitigation: track only repo-owned PID files, verify process liveness, and stop components in reverse dependency order.
