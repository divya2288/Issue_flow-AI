import json
import os
import time

from google import genai


# Models that were available in your Gemini account.
# We try them in order if one is temporarily unavailable.
MODELS = [
    "gemini-3.8-flash",
    "gemini-3.5-flash-lite",
    "gemini-3-flash-preview",
]


def clean_json_response(text):
    """
    Removes markdown code fences if Gemini returns them.
    """

    text = text.strip()

    if text.startswith("```json"):
        text = text[7:]

    elif text.startswith("```"):
        text = text[3:]

    if text.endswith("```"):
        text = text[:-3]

    return text.strip()


def analyze_issue(title, description):

    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise ValueError(
            "GEMINI_API_KEY is not configured."
        )

    client = genai.Client(
        api_key=api_key
    )

    prompt = f"""
You are an IT issue triage assistant.

Analyze the following reported IT issue.

TITLE:
{title}

DESCRIPTION:
{description}

Return ONLY valid JSON.

Use exactly these fields:

{{
  "category": "Hardware | Software | Network | Infrastructure | Security | Access | Other",
  "priority": "Low | Medium | High | Critical",
  "impact": "Low | Medium | High | Critical",
  "summary": "short professional summary",
  "suggested_action": "practical first action",
  "reason": "brief explanation for the selected priority"
}}

Rules:

1. Critical means a major production outage,
   severe security issue, or widespread business impact.

2. High means significant disruption affecting
   important users or systems.

3. Medium means normal operational impact.

4. Low means minor or limited impact.

5. Do not invent technical facts.

6. Keep the summary concise.

7. Suggested action must be practical and safe.

8. Return JSON only.

9. The priority must be based on the actual
   information provided in the issue.

10. Security vulnerabilities affecting production
    systems should normally receive High or Critical
    priority depending on the described impact.
"""

    last_error = None

    # Try each available model.
    for model in MODELS:

        print(f"Trying Gemini model: {model}")

        # Retry temporary availability problems.
        for attempt in range(3):

            try:

                print(
                    f"Gemini attempt "
                    f"{attempt + 1}/3 using {model}"
                )

                response = client.models.generate_content(
                    model=model,
                    contents=prompt,
                )

                if not response.text:
                    raise ValueError(
                        "Gemini returned an empty response."
                    )

                cleaned = clean_json_response(
                    response.text
                )

                result = json.loads(cleaned)

                # Validate expected fields.
                required_fields = [
                    "category",
                    "priority",
                    "impact",
                    "summary",
                    "suggested_action",
                    "reason",
                ]

                missing = [
                    field
                    for field in required_fields
                    if field not in result
                ]

                if missing:
                    raise ValueError(
                        "Gemini response is missing fields: "
                        + ", ".join(missing)
                    )

                print(
                    f"Gemini analysis successful "
                    f"using {model}"
                )

                return result

            except Exception as error:

                last_error = error

                error_text = str(error)

                print(
                    f"Gemini error with {model}: "
                    f"{error_text}"
                )

                # Retry only temporary availability errors.
                temporary_error = (
                    "503" in error_text
                    or "UNAVAILABLE" in error_text
                    or "429" in error_text
                    or "RESOURCE_EXHAUSTED" in error_text
                )

                if temporary_error:

                    if attempt < 2:

                        wait_time = 2 ** attempt

                        print(
                            f"Temporary Gemini problem. "
                            f"Retrying in {wait_time} seconds..."
                        )

                        time.sleep(wait_time)

                        continue

                # For non-temporary errors,
                # move to the next model.
                break

    raise RuntimeError(
        "Gemini AI analysis is temporarily unavailable. "
        "Please try Analyze with AI again."
    ) from last_error