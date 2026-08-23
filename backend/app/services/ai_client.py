import json
import logging

from openai import AsyncOpenAI, APIError, APITimeoutError

from app.core.config import settings

logger = logging.getLogger("app.ai")


class AIServiceNotConfiguredError(Exception):
    """No OPENAI_API_KEY is set. Callers must surface this clearly to
    the user rather than falling back to a fake/templated response -
    the platform must never claim something is AI-generated when it
    isn't."""


class AIServiceError(Exception):
    """The AI provider was called but failed (timeout, API error,
    invalid response)."""


_client: AsyncOpenAI | None = None


def _get_client() -> AsyncOpenAI:
    if not settings.OPENAI_API_KEY:
        raise AIServiceNotConfiguredError(
            "AI features are not configured on this server yet. "
            "Set OPENAI_API_KEY to enable them."
        )

    global _client

    if _client is None:
        _client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    return _client


async def generate_text(
    system_prompt: str,
    user_prompt: str,
    max_tokens: int | None = None,
) -> str:
    """Plain free-text completion - used for AI Content Studio."""
    client = _get_client()

    try:
        response = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            max_tokens=max_tokens or settings.AI_MAX_OUTPUT_TOKENS,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        )
    except APITimeoutError as exc:
        raise AIServiceError("AI provider timed out. Please try again.") from exc
    except APIError as exc:
        logger.error("OpenAI API error: %s", exc)
        raise AIServiceError("AI provider returned an error. Please try again.") from exc

    content = response.choices[0].message.content

    if not content or not content.strip():
        raise AIServiceError("AI provider returned an empty response.")

    return content.strip()


async def generate_json(
    system_prompt: str,
    user_prompt: str,
    max_tokens: int | None = None,
) -> dict:
    """
    Structured completion - used for AI project evaluation. Forces
    the model to return valid JSON via response_format, then parses
    it. Raises AIServiceError (never returns fabricated/guessed
    fields) if the model doesn't comply.
    """
    client = _get_client()

    try:
        response = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            max_tokens=max_tokens or settings.AI_MAX_OUTPUT_TOKENS,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        )
    except APITimeoutError as exc:
        raise AIServiceError("AI provider timed out. Please try again.") from exc
    except APIError as exc:
        logger.error("OpenAI API error: %s", exc)
        raise AIServiceError("AI provider returned an error. Please try again.") from exc

    content = response.choices[0].message.content

    if not content:
        raise AIServiceError("AI provider returned an empty response.")

    try:
        return json.loads(content)
    except json.JSONDecodeError as exc:
        logger.error("AI returned invalid JSON: %s", content[:500])
        raise AIServiceError(
            "AI provider returned an unexpected response format."
        ) from exc
