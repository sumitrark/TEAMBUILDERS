
import json
import logging

from openai import (
    AsyncOpenAI,
    APIError,
    APITimeoutError,
    AuthenticationError,
    RateLimitError,
)

from app.core.config import settings

logger = logging.getLogger("app.ai")


class AIServiceNotConfiguredError(Exception):
    """AI provider credentials are not configured."""


class AIServiceError(Exception):
    """The AI provider was called but failed."""


_client: AsyncOpenAI | None = None


def _get_client() -> AsyncOpenAI:
    global _client

    if not settings.OPENAI_API_KEY:
        raise AIServiceNotConfiguredError(
            "AI features are not configured. "
            "Set OPENAI_API_KEY in the backend environment."
        )

    if _client is None:
        _client = AsyncOpenAI(
            api_key=settings.OPENAI_API_KEY,
            base_url=settings.OPENAI_BASE_URL,
            timeout=30.0,
            max_retries=1,
        )

    return _client


async def generate_text(
    system_prompt: str,
    user_prompt: str,
    max_tokens: int | None = None,
) -> str:
    """Generate text for AI Content Studio."""
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

        content = response.choices[0].message.content

        if not content or not content.strip():
            raise AIServiceError("AI provider returned an empty response.")

        return content.strip()

    except APITimeoutError as exc:
        raise AIServiceError("AI provider timed out.") from exc
    except AuthenticationError as exc:
        raise AIServiceError(
            "AI provider authentication failed. Check the API key."
        ) from exc
    except RateLimitError as exc:
        raise AIServiceError(
            "AI provider quota or rate limit reached. Check your provider balance."
        ) from exc
    except APIError as exc:
        logger.error("AI provider API error: %s", exc)
        raise AIServiceError(
            "AI provider returned an error. Please try again."
        ) from exc


async def generate_json(
    system_prompt: str,
    user_prompt: str,
    max_tokens: int | None = None,
) -> dict:
    """Generate structured JSON for AI project evaluation."""
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

        content = response.choices[0].message.content

        if not content:
            raise AIServiceError("AI provider returned an empty response.")

        return json.loads(content)

    except APITimeoutError as exc:
        raise AIServiceError("AI provider timed out.") from exc
    except AuthenticationError as exc:
        raise AIServiceError(
            "AI provider authentication failed. Check the API key."
        ) from exc
    except RateLimitError as exc:
        raise AIServiceError(
            "AI provider quota or rate limit reached. Check your provider balance."
        ) from exc
    except APIError as exc:
        logger.error("AI provider API error: %s", exc)
        raise AIServiceError(
            "AI provider returned an error. Please try again."
        ) from exc
    except json.JSONDecodeError as exc:
        logger.error("AI returned invalid JSON.")
        raise AIServiceError(
            "AI provider returned an unexpected response format."
        ) from exc
