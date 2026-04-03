## 1. Verification Contract
Dependency note: `1.1` defines the source-of-truth workflow that `1.2`, `2.1`, and `3.1` must all reference.

- [x] 1.1 Document a canonical UI verification workflow with a default smoke path and explicitly separate deeper validation tiers for backend-served UI changes.
- [x] 1.2 Update repository operator instructions so UI build and verification guidance references the same canonical commands and artifact expectations.

## 2. Delivery and Drift Gates
Parallel note: `2.1` can proceed alongside `2.2` once the canonical workflow is defined.

- [x] 2.1 Add a fail-closed readiness gate that validates UI verification commands and required artifact paths against the repo's runnable entrypoints.
- [x] 2.2 Tighten the backend-served UI smoke or delivery path so it refuses to report success without a current built web artifact.
- [x] 2.3 Add backend integration coverage for serving the built operator shell and for explicit failure when the delivery contract is not satisfied.

## 3. Browser Smoke
Parallel note: `3.1` and `3.2` can proceed after the artifact contract in `2.2` is defined.

- [x] 3.1 Update the canonical browser smoke path so it builds the web bundle before backend-served browser verification runs.
- [x] 3.2 Keep a minimal Playwright smoke suite that exercises queue/detail navigation and at least one persisted operator workflow against the backend entrypoint.

## 4. Validation
- [x] 4.1 Run `uv run pytest backend/tests -q`.
- [x] 4.2 Run `npm run build` in `web/`.
- [x] 4.3 Run `npm run test:e2e` in `web/`.
- [x] 4.4 Run the new UI readiness gate and record the passing result.
