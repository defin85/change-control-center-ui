from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


def _read(relative_path: str) -> str:
    return (ROOT / relative_path).read_text(encoding="utf-8")


def test_agent_doc_index_links_core_authorities() -> None:
    source = _read("docs/agent/index.md")

    for snippet in [
        "docs/architecture/overview.md",
        "docs/agent/verification.md",
        "docs/agent/search.md",
        "docs/agent/session-completion.md",
        "openspec/AGENTS.md",
        "backend/AGENTS.md",
        "web/AGENTS.md",
        "scripts/AGENTS.md",
        "legacy/AGENTS.md",
        ".agents/skills/repo-onboarding/SKILL.md",
    ]:
        assert snippet in source


def test_root_agents_points_to_scoped_guidance() -> None:
    source = _read("AGENTS.md")

    for snippet in [
        "docs/agent/index.md",
        "docs/architecture/overview.md",
        "docs/agent/search.md",
        "docs/agent/session-completion.md",
        "backend/AGENTS.md",
        "web/AGENTS.md",
        "scripts/AGENTS.md",
        "legacy/AGENTS.md",
        "bash ./scripts/ccc verify ui-smoke",
    ]:
        assert snippet in source


def test_scoped_agents_exist_for_active_subsystems() -> None:
    for relative_path in [
        "backend/AGENTS.md",
        "web/AGENTS.md",
        "scripts/AGENTS.md",
        "legacy/AGENTS.md",
        "docs/architecture/overview.md",
        "legacy/prototype/README.md",
    ]:
        assert (ROOT / relative_path).exists(), relative_path
