from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.app.ui_delivery import ASSETS_DIR_NAME, BUILD_COMMAND, DEFAULT_WEB_DIST, INDEX_HTML_NAME

DOC_PATH = ROOT / "docs/agent/verification.md"
README_PATH = ROOT / "README.md"
AGENTS_PATH = ROOT / "AGENTS.md"
PACKAGE_JSON_PATH = ROOT / "web/package.json"
PLAYWRIGHT_CONFIG_PATH = ROOT / "web/playwright.config.ts"


def _require_text(path: Path, snippets: list[str], errors: list[str]) -> None:
    text = path.read_text(encoding="utf-8")
    for snippet in snippets:
        if snippet not in text:
            errors.append(f"{path.relative_to(ROOT)} must contain: {snippet}")


def main() -> int:
    errors: list[str] = []

    docs_snippets = [
        "uv run pytest backend/tests -q",
        "npm run lint",
        "npm run build",
        "npm run test:e2e",
        "npm run test:e2e:platform",
        "npm run test:e2e:full",
        str(DEFAULT_WEB_DIST / INDEX_HTML_NAME),
        f"{DEFAULT_WEB_DIST / ASSETS_DIR_NAME}/*",
        "frontend-only dev server",
    ]
    _require_text(DOC_PATH, docs_snippets, errors)
    _require_text(
        README_PATH,
        [
            "docs/agent/verification.md",
            "uv run pytest backend/tests -q",
            "npm run lint",
            "npm run build",
            "npm run test:e2e",
            "npm run test:e2e:platform",
        ],
        errors,
    )
    _require_text(
        AGENTS_PATH,
        [
            "docs/agent/verification.md",
            "default smoke path",
        ],
        errors,
    )

    package_json = json.loads(PACKAGE_JSON_PATH.read_text(encoding="utf-8"))
    scripts = package_json.get("scripts", {})
    expected_scripts = {
        "lint": "eslint src e2e vite.config.ts",
        "build": "tsc -b && vite build",
        "test:e2e": "playwright test --grep @smoke",
        "test:e2e:platform": "playwright test --grep @platform",
        "test:e2e:full": "playwright test",
    }
    for name, expected in expected_scripts.items():
        actual = scripts.get(name)
        if actual != expected:
            errors.append(f"web/package.json script {name!r} must equal {expected!r}, got {actual!r}")

    playwright_config = PLAYWRIGHT_CONFIG_PATH.read_text(encoding="utf-8")
    for snippet in [
        'baseURL: "http://127.0.0.1:8000"',
        'url: "http://127.0.0.1:8000/healthz/ui-artifact"',
        "cd web && npm run build && cd ..",
    ]:
        if snippet not in playwright_config:
            errors.append(f"web/playwright.config.ts must contain: {snippet}")

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
