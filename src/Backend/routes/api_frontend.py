# /api/chat -> api_frontend.py (structured 4-perspective responses)

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from src.Backend.routes.mainchat import classify_intent_and_respond
import json
import traceback

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    language_code: str = None

@router.post("/chat") #chatbot.jsx use krega iss endpoint ko
async def process_chat(request: ChatRequest):
    """Process chat messages and return appropriate response"""
    try:
        # First classify the intent
        intent_data_raw = await classify_intent_and_respond(request.message, request.language_code)
        print("intent_data_raw:", intent_data_raw)  # Debug log
        # If intent_data_raw is a dict with 'choices', extract the content
        if isinstance(intent_data_raw, dict) and "choices" in intent_data_raw:
            content = intent_data_raw["choices"][0]["message"]["content"]
            try:
                intent_data = json.loads(content)
            except json.JSONDecodeError as je:
                print("JSON decode error:", je)
                raise HTTPException(
                    status_code=500,
                    detail=f"Intent classification returned invalid JSON: {je}"
                )
        else:
            intent_data = intent_data_raw  # fallback
        print("intent_data:", intent_data)  # Debug log
        # If it's a structured (4-perspective) response, return the 4-perspective object
        if intent_data.get("type") == "structured":
            return {
                "status": "success",
                "data": {
                    "response": intent_data.get("response"),
                    "voice_message": intent_data.get("voice_message"),
                    "language_code": intent_data.get("language_code"),
                    "type": "structured"
                }
            }
        # Otherwise use normal chat or fallback
        reply = (
            intent_data.get("message")
            or intent_data.get("response")
            or "I'm sorry, I couldn't generate a response right now. Please try again."
        )
        return {
            "status": "success",
            "data": {
                "response": reply,
                "language_code": intent_data.get("language_code"),
                "type": "chat"
            }
        }
    except Exception as e:
        print("Exception in /api/chat:", str(e))
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

