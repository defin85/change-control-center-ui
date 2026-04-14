## 1. Runtime And Git Ingestion
- [ ] 1.1 Persist structured run outputs, terminal summaries, and check results from real runtime completion data.
- [ ] 1.2 Collect git status, diff, and check artifacts from managed worktrees and attach them to backend-owned run and change evidence.

## 2. Derived Product State
- [ ] 2.1 Replace synthetic post-run summaries, git counters, and evidence placeholders with state derived from ingested artifacts.
- [ ] 2.2 Surface ingested git and evidence data through selected-change and run-detail contracts without client-side reconstruction.

## 3. Proof
- [ ] 3.1 Add backend and browser coverage for evidence ingestion success, empty-artifact handling, and ingestion failure paths.
- [ ] 3.2 Run `openspec validate 13-add-real-runtime-output-and-git-evidence-ingestion --strict --no-interactive`.

