from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

DEFAULT_WEB_DIST = Path("web/dist")
INDEX_HTML_NAME = "index.html"
ASSETS_DIR_NAME = "assets"
BUILD_COMMAND = "cd web && npm run build"


@dataclass(frozen=True)
class WebArtifactStatus:
    web_dist: Path
    index_html: Path
    assets_dir: Path
    missing_paths: tuple[Path, ...]

    @property
    def ready(self) -> bool:
        return not self.missing_paths

    @property
    def detail(self) -> str:
        missing = ", ".join(str(path) for path in self.missing_paths)
        return f"Operator UI build artifact missing: {missing}. Run `{BUILD_COMMAND}`."

    def as_dict(self) -> dict[str, str]:
        return {
            "status": "ready",
            "webDist": str(self.web_dist),
            "indexHtml": str(self.index_html),
            "assetsDir": str(self.assets_dir),
        }


def inspect_web_artifact(web_dist: Path | None = None) -> WebArtifactStatus:
    resolved_web_dist = web_dist or DEFAULT_WEB_DIST
    index_html = resolved_web_dist / INDEX_HTML_NAME
    assets_dir = resolved_web_dist / ASSETS_DIR_NAME

    missing_paths: list[Path] = []
    if not index_html.is_file():
        missing_paths.append(index_html)
    if not assets_dir.is_dir() or not any(assets_dir.iterdir()):
        missing_paths.append(assets_dir)

    return WebArtifactStatus(
        web_dist=resolved_web_dist,
        index_html=index_html,
        assets_dir=assets_dir,
        missing_paths=tuple(missing_paths),
    )
