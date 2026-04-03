from __future__ import annotations

from scripts.check_ui_readiness import (
    AGENTS_PATH,
    DOC_PATH,
    LAUNCHER_PATH,
    LAUNCHER_PROFILES_PATH,
    PACKAGE_JSON_PATH,
    PLAYWRIGHT_CONFIG_PATH,
    README_PATH,
    collect_ui_readiness_errors,
    collect_ui_readiness_runtime_errors,
)


def _current_inputs() -> dict[str, str]:
    return {
        "doc_text": DOC_PATH.read_text(encoding="utf-8"),
        "readme_text": README_PATH.read_text(encoding="utf-8"),
        "agents_text": AGENTS_PATH.read_text(encoding="utf-8"),
        "package_json_text": PACKAGE_JSON_PATH.read_text(encoding="utf-8"),
        "playwright_config_text": PLAYWRIGHT_CONFIG_PATH.read_text(encoding="utf-8"),
        "launcher_text": LAUNCHER_PATH.read_text(encoding="utf-8"),
        "launcher_profiles_text": LAUNCHER_PROFILES_PATH.read_text(encoding="utf-8"),
    }


def test_current_repo_ui_readiness_contract_passes() -> None:
    assert collect_ui_readiness_errors(**_current_inputs()) == []
    assert collect_ui_readiness_runtime_errors() == []


def test_ui_readiness_contract_rejects_reused_backend_server() -> None:
    inputs = _current_inputs()
    inputs["playwright_config_text"] = inputs["playwright_config_text"].replace(
        "reuseExistingServer: false",
        "reuseExistingServer: true",
    )

    errors = collect_ui_readiness_errors(**inputs)

    assert any("reuseExistingServer: false" in error for error in errors)
    assert any("must not set reuseExistingServer: true" in error for error in errors)


def test_ui_readiness_contract_rejects_missing_launcher_entrypoint() -> None:
    inputs = _current_inputs()
    inputs["playwright_config_text"] = inputs["playwright_config_text"].replace(
        "bash ./scripts/ccc build web && bash ./scripts/ccc start e2e --foreground",
        "npm run build && npm run test:e2e",
    )

    errors = collect_ui_readiness_errors(**inputs)

    assert any("bash ./scripts/ccc build web && bash ./scripts/ccc start e2e --foreground" in error for error in errors)
