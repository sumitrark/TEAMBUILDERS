import base64
import logging
import re

import httpx

from app.core.config import settings

logger = logging.getLogger("app.github_context")

GITHUB_URL_PATTERN = re.compile(
    r"github\.com/(?P<owner>[\w.-]+)/(?P<repo>[\w.-]+?)(?:\.git)?/?$"
)


def _parse_owner_repo(github_url: str) -> tuple[str, str] | None:
    match = GITHUB_URL_PATTERN.search(github_url.strip())

    if not match:
        return None

    return match.group("owner"), match.group("repo")


async def fetch_github_readme(github_url: str) -> str | None:
    """
    Best-effort fetch of a public repo's README for AI context. Never
    raises - grounding context is an enhancement, not a hard
    requirement, so any failure (private repo, rate limit, 404,
    network error) just means the AI proceeds without it.
    """
    parsed = _parse_owner_repo(github_url)

    if not parsed:
        return None

    owner, repo = parsed

    url = f"https://api.github.com/repos/{owner}/{repo}/readme"

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.get(
                url,
                headers={"Accept": "application/vnd.github+json"},
            )

        if response.status_code != 200:
            return None

        data = response.json()
        encoded_content = data.get("content", "")

        readme_text = base64.b64decode(encoded_content).decode(
            "utf-8", errors="ignore"
        )

        return readme_text[: settings.GITHUB_CONTEXT_MAX_CHARS]

    except Exception as exc:  # noqa: BLE001 - genuinely best-effort
        logger.warning("Could not fetch README for %s: %s", github_url, exc)
        return None
