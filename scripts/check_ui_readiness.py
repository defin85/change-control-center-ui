from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.app.ui_delivery import ASSETS_DIR_NAME, BUILD_COMMAND, DEFAULT_WEB_DIST, INDEX_HTML_NAME

DOC_PATH = ROOT / "docs/agent/verification.md"
DOC_INDEX_PATH = ROOT / "docs/agent/index.md"
ARCHITECTURE_DOC_PATH = ROOT / "docs/architecture/overview.md"
README_PATH = ROOT / "README.md"
AGENTS_PATH = ROOT / "AGENTS.md"
PACKAGE_JSON_PATH = ROOT / "web/package.json"
PLAYWRIGHT_CONFIG_PATH = ROOT / "web/playwright.config.ts"
PLAYWRIGHT_APP_SPEC_PATH = ROOT / "web/e2e/app.spec.ts"
LAUNCHER_PATH = ROOT / "scripts/ccc"
LAUNCHER_PROFILES_PATH = ROOT / "scripts/lib/ccc/profiles.sh"
LAUNCHER_VERIFY_PATH = ROOT / "scripts/lib/ccc/verify.sh"


def _require_text(label: str, text: str, snippets: list[str], errors: list[str]) -> None:
    for snippet in snippets:
        if snippet not in text:
            errors.append(f"{label} must contain: {snippet}")


def collect_ui_readiness_errors(
    *,
    doc_text: str,
    readme_text: str,
    agents_text: str,
    package_json_text: str,
    playwright_config_text: str,
    playwright_app_spec_text: str,
    launcher_text: str,
    launcher_profiles_text: str,
    launcher_verify_text: str,
) -> list[str]:
    errors: list[str] = []
    launcher_surface_text = "\n".join([launcher_text, launcher_verify_text])

    docs_snippets = [
        "bash ./scripts/ccc verify ui-smoke",
        "bash ./scripts/ccc verify ui-platform",
        "bash ./scripts/ccc verify ui-full",
        "Smoke tier:",
        "Platform tier:",
        "Full tier:",
        "dedicated full-only `@full` cross-workspace proof journeys",
        "uv run pytest backend/tests -q",
        "npm run lint",
        "npm run build",
        "npm run test:e2e",
        "npm run test:e2e:platform",
        "npm run test:e2e:full",
        str(DEFAULT_WEB_DIST / INDEX_HTML_NAME),
        f"{DEFAULT_WEB_DIST / ASSETS_DIR_NAME}/*",
        "frontend-only dev server",
        "must not reuse an already running backend-served stack",
        "bash ./scripts/ccc",
        "bash ./scripts/ccc start served",
        "bash ./scripts/ccc start dev",
    ]
    _require_text(str(DOC_PATH.relative_to(ROOT)), doc_text, docs_snippets, errors)
    _require_text(
        str(README_PATH.relative_to(ROOT)),
        readme_text,
        [
            "docs/agent/verification.md",
            "docs/agent/index.md",
            "docs/architecture/overview.md",
            "bash ./scripts/ccc verify ui-smoke",
            "bash ./scripts/ccc verify ui-platform",
            "bash ./scripts/ccc verify ui-full",
            "Smoke tier:",
            "Platform tier:",
            "Full tier:",
            "uv run pytest backend/tests -q",
            "uv run python scripts/check_ui_readiness.py",
            "legacy/prototype/README.md",
        ],
        errors,
    )
    _require_text(
        str(AGENTS_PATH.relative_to(ROOT)),
        agents_text,
        [
            "docs/agent/index.md",
            "docs/agent/verification.md",
            "docs/agent/search.md",
            "docs/agent/session-completion.md",
            "backend/AGENTS.md",
            "web/AGENTS.md",
            "scripts/AGENTS.md",
            "legacy/AGENTS.md",
            "bash ./scripts/ccc verify ui-smoke",
        ],
        errors,
    )

    for doc_path in [DOC_INDEX_PATH, ARCHITECTURE_DOC_PATH]:
        if not doc_path.exists():
            errors.append(f"required onboarding document missing: {doc_path.relative_to(ROOT)}")

    package_json = json.loads(package_json_text)
    scripts = package_json.get("scripts", {})
    expected_scripts = {
        "lint": "eslint src e2e vite.config.ts",
        "build": "tsc -b && vite build",
        "test:e2e": "playwright test --grep @smoke",
        "test:e2e:platform": "playwright test --grep @platform",
        "test:e2e:full": "playwright test --grep @full",
    }
    for name, expected in expected_scripts.items():
        actual = scripts.get(name)
        if actual != expected:
            errors.append(f"web/package.json script {name!r} must equal {expected!r}, got {actual!r}")

    playwright_titles = re.findall(r'^\s*test\("([^"]+)"', playwright_app_spec_text, flags=re.MULTILINE)
    full_titles = [title for title in playwright_titles if "@full" in title]
    full_only_titles = [
        title for title in full_titles if "@platform" not in title and "@smoke" not in title
    ]
    shared_full_titles = [
        title for title in full_titles if "@platform" in title or "@smoke" in title
    ]
    required_full_only_titles = [
        "full proof pack reconciles external clarification activity after catalog authoring without losing workspace context @full",
        "full proof pack spans catalog authoring, collaboration, commands, runs, approvals, and owning-change handoff @full",
    ]

    if len(full_only_titles) < 2:
        errors.append("web/e2e/app.spec.ts must define at least two dedicated full-only @full proof scenarios")

    if shared_full_titles:
        errors.append(
            "web/e2e/app.spec.ts must keep @full as a dedicated tier instead of dual-tagging smoke/platform tests"
        )

    for title in required_full_only_titles:
        if title not in full_only_titles:
            errors.append(f"web/e2e/app.spec.ts must contain dedicated full-tier proof: {title}")

    for snippet in [
        'baseURL: "http://127.0.0.1:8000"',
        'url: "http://127.0.0.1:8000/healthz/ui-artifact"',
        "bash ./scripts/ccc build web && bash ./scripts/ccc start e2e --foreground",
        "reuseExistingServer: false",
    ]:
        if snippet not in playwright_config_text:
            errors.append(f"web/playwright.config.ts must contain: {snippet}")

    if "reuseExistingServer: true" in playwright_config_text:
        errors.append(
            "web/playwright.config.ts must not set reuseExistingServer: true because backend-entrypoint smoke must fail closed instead of reusing an already running stack"
        )

    launcher_requirements = {
        "bash ./scripts/ccc build web": ["bash ./scripts/ccc build web"],
        "start <dev|served|e2e> [--foreground]": ["start <dev|served|e2e> [--foreground]"],
        "stop <dev|served|e2e|all>": ["stop <dev|served|e2e|all>"],
        "restart <dev|served|e2e> [--foreground]": ["restart <dev|served|e2e> [--foreground]"],
        "status [dev|served|e2e|all]": ["status [dev|served|e2e|all]"],
        "logs <dev|served|e2e> <sidecar|backend|vite> [-f]": [
            "logs <dev|served|e2e> <sidecar|backend|vite> [-f]"
        ],
        "verify <ui-smoke|ui-platform|ui-full>": ["verify <ui-smoke|ui-platform|ui-full>"],
        "uv run pytest backend/tests -q": ["uv run pytest backend/tests -q"],
        "npm run test:e2e": ["npm run test:e2e", "ccc_run_verify_playwright_phase test:e2e"],
        "npm run test:e2e:platform": [
            "npm run test:e2e:platform",
            "ccc_run_verify_playwright_phase test:e2e:platform",
        ],
        "npm run test:e2e:full": ["npm run test:e2e:full", "ccc_run_verify_playwright_phase test:e2e:full"],
    }
    for label, allowed_snippets in launcher_requirements.items():
        if not any(snippet in launcher_surface_text for snippet in allowed_snippets):
            errors.append(f"launcher sources must contain: {label}")

    for snippet in [
        "fake_stdio_app_server.py",
        "CCC_RUNTIME_COMMAND=uv run python backend/tests/fake_stdio_app_server.py",
        "CCC_PROFILE_COMPONENTS=(sidecar backend vite)",
        "CCC_PROFILE_COMPONENTS=(sidecar backend)",
    ]:
        if snippet not in launcher_profiles_text:
            errors.append(f"scripts/lib/ccc/profiles.sh must contain: {snippet}")

    return errors


def collect_ui_readiness_runtime_errors() -> list[str]:
    errors: list[str] = []

    syntax_check = subprocess.run(
        [
            "bash",
            "-n",
            str(LAUNCHER_PATH),
            str(ROOT / "scripts/lib/ccc/common.sh"),
            str(ROOT / "scripts/lib/ccc/process.sh"),
            str(ROOT / "scripts/lib/ccc/profiles.sh"),
            str(LAUNCHER_VERIFY_PATH),
        ],
        cwd=ROOT,
        text=True,
        capture_output=True,
        check=False,
    )
    if syntax_check.returncode != 0:
        stderr = syntax_check.stderr.strip() or syntax_check.stdout.strip() or "bash -n failed"
        errors.append(f"launcher shell syntax check failed: {stderr}")

    help_check = subprocess.run(
        ["bash", str(LAUNCHER_PATH), "help"],
        cwd=ROOT,
        text=True,
        capture_output=True,
        check=False,
    )
    if help_check.returncode != 0:
        stderr = help_check.stderr.strip() or help_check.stdout.strip() or "launcher help failed"
        errors.append(f"scripts/ccc help must succeed: {stderr}")
    else:
        for snippet in [
            "bash ./scripts/ccc build web",
            "start <dev|served|e2e> [--foreground]",
            "stop <dev|served|e2e|all>",
            "verify <ui-smoke|ui-platform|ui-full>",
        ]:
            if snippet not in help_check.stdout:
                errors.append(f"scripts/ccc help output must contain: {snippet}")

    status_check = subprocess.run(
        ["bash", str(LAUNCHER_PATH), "status", "all"],
        cwd=ROOT,
        text=True,
        capture_output=True,
        check=False,
    )
    if status_check.returncode != 0:
        stderr = status_check.stderr.strip() or status_check.stdout.strip() or "launcher status failed"
        errors.append(f"scripts/ccc status all must succeed: {stderr}")

    return errors


def main() -> int:
    errors = collect_ui_readiness_errors(
        doc_text=DOC_PATH.read_text(encoding="utf-8"),
        readme_text=README_PATH.read_text(encoding="utf-8"),
        agents_text=AGENTS_PATH.read_text(encoding="utf-8"),
        package_json_text=PACKAGE_JSON_PATH.read_text(encoding="utf-8"),
        playwright_config_text=PLAYWRIGHT_CONFIG_PATH.read_text(encoding="utf-8"),
        playwright_app_spec_text=PLAYWRIGHT_APP_SPEC_PATH.read_text(encoding="utf-8"),
        launcher_text=LAUNCHER_PATH.read_text(encoding="utf-8"),
        launcher_profiles_text=LAUNCHER_PROFILES_PATH.read_text(encoding="utf-8"),
        launcher_verify_text=LAUNCHER_VERIFY_PATH.read_text(encoding="utf-8"),
    )
    errors.extend(collect_ui_readiness_runtime_errors())

    if errors:
        print("UI readiness check failed:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        print(
            "Fix the documented command, helper automation, or runnable entrypoint so they match the canonical UI verification workflow.",
            file=sys.stderr,
        )
        return 1

    print("UI readiness contract OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
