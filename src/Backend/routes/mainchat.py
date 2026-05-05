import os
import json
from typing import Dict, List

import httpx
from dotenv import load_dotenv

load_dotenv()
SARVAM_API_KEY = os.getenv("SARVAM_API_KEY")

# Conversation history store
conversation_history: List[Dict] = []


def _extract_json_payload(content: str) -> str:
    content = content.strip()

    think_start = content.lower().find("<think>")
    think_end = content.lower().find("</think>")
    if think_start != -1 and think_end != -1 and think_end > think_start:
        content = (content[:think_start] + content[think_end + len("</think>"):]).strip()

    if content.startswith("```json"):
        content = content[len("```json"):].strip()
    if content.startswith("```"):
        content = content[len("```"):].strip()
    if content.endswith("```"):
        content = content[:-3].strip()

    start_index = content.find("{")
    end_index = content.rfind("}")
    if start_index != -1 and end_index != -1 and end_index > start_index:
        return content[start_index : end_index + 1]
    return content


async def classify_intent_and_respond(text: str, language_code: str = None) -> Dict:
    """
    Always return 4-perspective responses.
    Every question gets responses from Health, Family, Dream, and Society perspectives.
    """
    conversation_history.append({"role": "user", "content": text})

    system_message = {
        "role": "system",
        "content": (
            "Your name is Indian-AI, an Indian based AI assistant. You MUST respond in valid JSON format only, with no other text.\n"
            "Respond with 4 perspectives: Health, Family, Dream, and Society.\n"
            "Be direct, honest, and provide actionable insights in 2-3 sentences per perspective.\n"
            "Include 2 key points for each perspective that are specific and practical.\n\n"
            'Response format:\n'
            '{\n'
            '    "health": {\n'
            '        "perspective": "Brief insight about health/wellness aspect",\n'
            '        "key_points": ["Specific point 1", "Specific point 2"]\n'
            '    },\n'
            '    "family": {\n'
            '        "perspective": "Brief insight about family/relationships aspect",\n'
            '        "key_points": ["Specific point 1", "Specific point 2"]\n'
            '    },\n'
            '    "dream": {\n'
            '        "perspective": "Brief insight about dreams/goals/ambitions aspect",\n'
            '        "key_points": ["Specific point 1", "Specific point 2"]\n'
            '    },\n'
            '    "society": {\n'
            '        "perspective": "Brief insight about social/community/impact aspect",\n'
            '        "key_points": ["Specific point 1", "Specific point 2"]\n'
            '    }\n'
            "}"
        )
    }

    messages = [system_message, {"role": "user", "content": text}]

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                "https://api.sarvam.ai/v1/chat/completions",
                headers={"Authorization": f"Bearer {SARVAM_API_KEY}", "Content-Type": "application/json"},
                json={
                    "model": "sarvam-m",
                    "messages": messages,
                    "temperature": 0.3,
                    "max_tokens": 1500,
                },
            )

        data = response.json()
        content = ""
        if "choices" in data:
            content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        elif "data" in data and isinstance(data["data"], list) and data["data"]:
            content = data["data"][0].get("content", "")

        if not content or not content.strip():
            return {
                "type": "structured",
                "response": {"error": "No response received from API"},
                "language_code": language_code,
            }

        conversation_history.append({"role": "assistant", "content": content})

        content = _extract_json_payload(content)

        try:
            structured_response = json.loads(content)
        except json.JSONDecodeError as e:
            print(f"JSON decode error: {e}")
            print(f"Raw content: {content}")
            structured_response = {"error": "Failed to parse response", "raw": content}

        return {
            "type": "structured",
            "response": structured_response,
            "language_code": language_code,
        }

    except Exception as e:
        print(f"Error in 4-perspective response: {e}")
        return {
            "type": "structured",
            "response": {"error": str(e)},
            "language_code": language_code,
        }
