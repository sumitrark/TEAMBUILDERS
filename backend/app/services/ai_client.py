
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
    """
    Create and reuse the asynchronous AI client.

    Supports OpenAI-compatible providers such as OpenRouter.
    """

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
    """
    Generate natural-language AI content.

    Used by:
    - AI Content Studio
    - AI Help Center
    - Other text-generation features
    """

    client = _get_client()

    try:
        response = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            max_tokens=(
                max_tokens or settings.AI_MAX_OUTPUT_TOKENS
            ),
            messages=[
                {
                    "role": "system",
                    "content": system_prompt,
                },
                {
                    "role": "user",
                    "content": user_prompt,
                },
            ],
        )

        content = response.choices[0].message.content

        if not content or not content.strip():
            raise AIServiceError(
                "AI provider returned an empty response."
            )

        return content.strip()

    except APITimeoutError as exc:
        logger.warning("AI provider request timed out.")
        raise AIServiceError(
            "AI provider timed out."
        ) from exc

    except AuthenticationError as exc:
        logger.error("AI provider authentication failed.")
        raise AIServiceError(
            "AI provider authentication failed. Check the API key."
        ) from exc

    except RateLimitError as exc:
        logger.warning("AI provider quota or rate limit reached.")
        raise AIServiceError(
            "AI provider quota or rate limit reached. "
            "Check your provider balance."
        ) from exc

    except APIError as exc:
        logger.exception("AI provider API error.")
        raise AIServiceError(
            "AI provider returned an error. Please try again."
        ) from exc


async def generate_json(
    system_prompt: str,
    user_prompt: str,
    max_tokens: int | None = None,
) -> dict:
    """
    Generate structured JSON using the AI provider.

    Used by AI evaluation and structured AI features.
    """

    client = _get_client()

    try:
        response = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            max_tokens=(
                max_tokens or settings.AI_MAX_OUTPUT_TOKENS
            ),
            response_format={
                "type": "json_object",
            },
            messages=[
                {
                    "role": "system",
                    "content": system_prompt,
                },
                {
                    "role": "user",
                    "content": user_prompt,
                },
            ],
        )

        content = response.choices[0].message.content

        if not content or not content.strip():
            raise AIServiceError(
                "AI provider returned an empty response."
            )

        result = json.loads(content)

        if not isinstance(result, dict):
            raise AIServiceError(
                "AI provider returned an unexpected JSON format."
            )

        return result

    except APITimeoutError as exc:
        logger.warning("AI provider request timed out.")
        raise AIServiceError(
            "AI provider timed out."
        ) from exc

    except AuthenticationError as exc:
        logger.error("AI provider authentication failed.")
        raise AIServiceError(
            "AI provider authentication failed. Check the API key."
        ) from exc

    except RateLimitError as exc:
        logger.warning("AI provider quota or rate limit reached.")
        raise AIServiceError(
            "AI provider quota or rate limit reached. "
            "Check your provider balance."
        ) from exc

    except APIError as exc:
        logger.exception("AI provider API error.")
        raise AIServiceError(
            "AI provider returned an error. Please try again."
        ) from exc

    except json.JSONDecodeError as exc:
        logger.error("AI returned invalid JSON.")
        raise AIServiceError(
            "AI provider returned an unexpected response format."
        ) from exc
