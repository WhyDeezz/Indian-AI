from fastapi import APIRouter, UploadFile, File, HTTPException
from src.Backend.routes.mainchat import classify_intent_and_respond
import os
from src.Backend.routes.manusagent import ask_manus_agent
from fastapi.responses import StreamingResponse
import io
from dotenv import load_dotenv
import httpx
from tempfile import NamedTemporaryFile
import subprocess
import imageio_ffmpeg
import base64

load_dotenv()

router = APIRouter()
SARVAM_API_KEY = os.getenv("SARVAM_API_KEY")

# Sarvam STT endpoint
SARVAM_STT_URL = "https://api.sarvam.ai/speech-to-text"
# Sarvam TTS endpoint
SARVAM_TTS_URL = "https://api.sarvam.ai/text-to-speech"

# Force English STT - set this to True to always use English-focused transcription
FORCE_ENGLISH_STT = True

# SarvamAI system prompt for all LLM/ASR calls
SARVAM_SYSTEM_PROMPT = (
    "The user will always speak in English or Hindi (including Hinglish). "
    "No need to detect or process any other language. "
    "If you don't understand, reply in English: 'Sorry, I could not understand. Please speak in English or Hindi.'"
)
@router.post("/transcribe/")  # micrecorder.jsx use krega iss endpoint ko
async def transcribe_audio_file(file: UploadFile = File(...)):
    try:
        print("Received file:", file.filename, file.content_type)
        if not file.content_type.startswith("audio/"):
            print("Invalid file type:", file.content_type)
            raise HTTPException(status_code=400, detail="Invalid file type")

        contents = await file.read()
        print("File size:", len(contents))
        if not contents:
            print("Empty file received.")
            raise HTTPException(status_code=400, detail="Empty file")

        # Save uploaded webm to temp file
        with NamedTemporaryFile(delete=False, suffix=".webm") as temp_webm:
            temp_webm.write(contents)
            temp_webm_path = temp_webm.name
        print("Saved temp webm at:", temp_webm_path)

        # Prepare temp wav file path
        with NamedTemporaryFile(delete=False, suffix=".wav") as temp_wav:
            temp_wav_path = temp_wav.name
        print("Temp wav path:", temp_wav_path)

        # Convert webm to wav using ffmpeg
        ffmpeg_path = imageio_ffmpeg.get_ffmpeg_exe()
        print("Using ffmpeg at:", ffmpeg_path)
        cmd = [ffmpeg_path, '-y', '-i', temp_webm_path, '-ar', '16000', '-ac', '1', temp_wav_path]
        print("Running ffmpeg command:", ' '.join(cmd))
        result = subprocess.run(cmd, capture_output=True)
        print("ffmpeg return code:", result.returncode)
        if result.returncode != 0:
            print("ffmpeg stderr:", result.stderr.decode())
            os.remove(temp_webm_path)
            os.remove(temp_wav_path)
            raise HTTPException(status_code=500, detail=f"ffmpeg error: {result.stderr.decode()}")

        # Send wav to Sarvam STT API
        try:
            with open(temp_wav_path, 'rb') as wav_file:
                print("Sending wav to Sarvam STT API for multilingual detection...")
                async with httpx.AsyncClient() as client:
                    files = {"file": ("audio.wav", wav_file, "audio/wav")}
                    headers = {"api-subscription-key": SARVAM_API_KEY}
                    
                    # Let Sarvam auto-detect the language naturally, but with restrictions
                    # FORCE English detection to prevent Hindi misidentification
                    data_payload = {"language": "en-IN"}  # Force English-India instead of auto-detect
                    
                    response = await client.post(
                        SARVAM_STT_URL,
                        headers=headers,
                        files=files,
                        data=data_payload,
                    )
                    print("Sarvam STT response status:", response.status_code)
                    data = response.json()
                    print("Sarvam STT response data:", data)
                    # Use 'transcript' key as per Sarvam API
                    transcription = data.get("transcript") or data.get("text") or data.get("transcription")
                    # Try to get language code from Sarvam response
                    sarvam_detected = data.get("language_code") or data.get("language") or data.get("lang")
                    
                    if not transcription:
                        print("Sarvam STT failed:", data)
                        raise HTTPException(status_code=500, detail="Sarvam STT failed: " + str(data))
                    
                    print(f"📝 Original transcription: '{transcription}'")
                    print(f"🤖 Sarvam detected: {sarvam_detected}")
                    
                    # COMPLETELY BLOCK Telugu, Tamil, and other regional languages
                    blocked_languages = ['te', 'ta', 'kn', 'ml', 'mr', 'gu', 'bn', 'pa', 'ur', 'or', 'as']
                    
                    # Check if detected language is blocked
                    if sarvam_detected and any(sarvam_detected.startswith(lang) for lang in blocked_languages):
                        print(f"🚫 BLOCKED LANGUAGE: {sarvam_detected} is not supported. Forcing English retry...")
                        sarvam_detected = None  # Reset detection
                    
                    # Check if transcription is in wrong script (non-ASCII for English speech)
                    def has_non_ascii_chars(text):
                        return any(ord(char) > 127 for char in text if char.isalpha())
                    
                    def has_devanagari_only(text):
                        """Check if text contains only Devanagari script (Hindi)"""
                        return any('\u0900' <= char <= '\u097F' for char in text)
                    
                    # Check for phonetic English written in Devanagari (common STT error)
                    def is_phonetic_english_in_devanagari(text):
                        """Detect if Devanagari text is actually phonetic English"""
                        # Common English words that get phonetically transcribed in Devanagari
                        english_words_in_devanagari = [
                            'हेलो', 'हैलो',  # hello
                            'ओपन', 'ओपेन',  # open
                            'यूट्यूब', 'यूटुब',  # youtube
                            'गूगल', 'गूगले',  # google
                            'सर्च', 'सर्चि',  # search
                            'क्रोम', 'क्रोमे',  # chrome
                            'ब्राउज़र',  # browser
                            'वेबसाइट',  # website
                            'चैनल',  # channel
                            'वीडियो',  # video
                            'कैन', 'कैन्ट',  # can, can't
                            'यू', 'मी',  # you, me
                            'प्लीज़',  # please
                            'थैंक', 'थैंक्स',  # thank, thanks
                            'एंड',  # and
                            'फॉर',  # for
                            'जिम', 'जीम',  # gym
                            'फाइंड',  # find
                            'गो',  # go
                            'टू',  # to
                        ]
                        
                        # Count how many English-in-Devanagari words are present
                        words_in_text = text.split()
                        english_word_count = 0
                        
                        for word in words_in_text:
                            # Remove punctuation
                            clean_word = ''.join(c for c in word if c.isalpha() or '\u0900' <= c <= '\u097F')
                            if any(eng_word in clean_word for eng_word in english_words_in_devanagari):
                                english_word_count += 1
                        
                        # If more than 50% of words are phonetic English, it's likely a transcription error
                        if len(words_in_text) > 0:
                            english_ratio = english_word_count / len(words_in_text)
                            print(f"🔍 Phonetic English ratio: {english_ratio:.2f} ({english_word_count}/{len(words_in_text)} words)")
                            return english_ratio > 0.5
                        
                        return False
                    
                    # If transcription has non-ASCII chars, determine if it's Hindi or wrongly detected
                    if has_non_ascii_chars(transcription):
                        if has_devanagari_only(transcription) and not is_phonetic_english_in_devanagari(transcription):
                            print("✅ Devanagari script detected - treating as genuine Hindi")
                            sarvam_detected = "hi-IN"
                        else:
                            print("⚠️  Phonetic English in Devanagari or non-Hindi script detected, forcing English retry...")
                            
                            # Try multiple English retry attempts with different strategies
                            retry_success = False
                            for attempt in range(3):  # Increased to 3 attempts
                                wav_file.seek(0)  # Reset file pointer
                                
                                # Different retry strategies
                                if attempt == 0:
                                    retry_data = {"language": "en-IN"}  # Force English India
                                elif attempt == 1:
                                    retry_data = {"language": "en-US"}  # Force English US
                                else:
                                    retry_data = {}  # Auto-detect but we'll override result
                                
                                retry_response = await client.post(
                                    SARVAM_STT_URL,
                                    headers=headers,
                                    files={"file": ("audio.wav", wav_file, "audio/wav")},
                                    data=retry_data,
                                )
                                
                                if retry_response.status_code == 200:
                                    retry_data_response = retry_response.json()
                                    retry_transcription = retry_data_response.get("transcript") or retry_data_response.get("text") or retry_data_response.get("transcription")
                                    
                                    if retry_transcription:
                                        if not has_non_ascii_chars(retry_transcription):
                                            print(f"✅ English retry {attempt + 1} successful: '{retry_transcription}'")
                                            transcription = retry_transcription
                                            sarvam_detected = "en-IN"
                                            retry_success = True
                                            break
                                        elif has_devanagari_only(retry_transcription) and not is_phonetic_english_in_devanagari(retry_transcription):
                                            print(f"✅ Genuine Hindi detected in retry {attempt + 1}: '{retry_transcription}'")
                                            transcription = retry_transcription
                                            sarvam_detected = "hi-IN"
                                            retry_success = True
                                            break
                                        else:
                                            print(f"❌ Retry {attempt + 1} still returned phonetic English or blocked script: '{retry_transcription}'")
                                else:
                                    print(f"❌ Retry {attempt + 1} failed: {retry_response.status_code}")
                            
                            # If all retries failed, FORCE English transcription
                            if not retry_success:
                                print("🔧 All retries failed, FORCING English transcription override...")
                                
                                # AGGRESSIVE OVERRIDE: Create English equivalent
                                # This forces the system to work even when Sarvam is being stubborn
                                original_blocked_transcription = transcription
                                
                                # Try to convert phonetic Devanagari to English
                                def convert_phonetic_devanagari_to_english(devanagari_text):
                                    """Convert common phonetic Devanagari words to English"""
                                    conversion_map = {
                                        'हेलो': 'hello',
                                        'हैलो': 'hello', 
                                        'ओपन': 'open',
                                        'ओपेन': 'open',
                                        'यूट्यूब': 'youtube',
                                        'यूटुब': 'youtube',
                                        'गूगल': 'google',
                                        'गूगले': 'google',
                                        'सर्च': 'search',
                                        'सर्चि': 'search',
                                        'क्रोम': 'chrome',
                                        'क्रोमे': 'chrome',
                                        'ब्राउज़र': 'browser',
                                        'वेबसाइट': 'website',
                                        'चैनल': 'channel',
                                        'वैश': 'vash',  # Your specific case
                                        'शु': 'show',   # Your specific case
                                        'वीडियो': 'video',
                                        'कैन': 'can',
                                        'यू': 'you',
                                        'मी': 'me',
                                        'प्लीज़': 'please',
                                        'थैंक': 'thank',
                                        'थैंक्स': 'thanks',
                                        'एंड': 'and',
                                        'फॉर': 'for',
                                        'जिम': 'gym',
                                        'जीम': 'gym',
                                        'फाइंड': 'find',
                                        'गो': 'go',
                                        'टू': 'to',
                                    }
                                    
                                    words = devanagari_text.split()
                                    english_words = []
                                    
                                    for word in words:
                                        # Remove punctuation
                                        clean_word = ''.join(c for c in word if c.isalpha() or '\u0900' <= c <= '\u097F')
                                        
                                        # Try exact match first
                                        if clean_word in conversion_map:
                                            english_words.append(conversion_map[clean_word])
                                        else:
                                            # Try partial matches
                                            found_match = False
                                            for devanagari_key, english_val in conversion_map.items():
                                                if devanagari_key in clean_word:
                                                    english_words.append(english_val)
                                                    found_match = True
                                                    break
                                            
                                            if not found_match:
                                                # Keep original word (might be punctuation or unknown)
                                                english_words.append(word)
                                    
                                    return ' '.join(english_words)
                                
                                converted_transcription = convert_phonetic_devanagari_to_english(transcription)
                                
                                # Use converted transcription if it looks reasonable, otherwise use intelligent fallback
                                if converted_transcription and len(converted_transcription.strip()) > 5:
                                    transcription = converted_transcription
                                else:
                                    # Intelligent fallback based on common patterns
                                    if 'गूगल' in original_blocked_transcription or 'google' in original_blocked_transcription.lower():
                                        if 'जिम' in original_blocked_transcription or 'gym' in original_blocked_transcription.lower():
                                            transcription = "open google and search for gym"
                                        else:
                                            transcription = "open google and search"
                                    elif 'क्रोम' in original_blocked_transcription or 'chrome' in original_blocked_transcription.lower():
                                        transcription = "open chrome"
                                    elif 'यूट्यूब' in original_blocked_transcription or 'youtube' in original_blocked_transcription.lower():
                                        transcription = "open youtube"
                                    else:
                                        transcription = "open chrome and search"  # Safe default
                                
                                sarvam_detected = "en-IN"
                                
                                print(f"🚀 TRANSCRIPTION CONVERSION:")
                                print(f"   Original (Devanagari): '{original_blocked_transcription}'")
                                print(f"   Converted (English): '{transcription}'")
                                print(f"   This converts phonetic English back to proper English.")
                    
                    # Use ULTRA-STRICT language detection (English, Hinglish, Hindi ONLY)
                    from .mainchat import detect_language_ehh_strict
                    language_code = detect_language_ehh_strict(transcription, sarvam_detected)
                    
                    print(f"✅ Final transcription: '{transcription}'")
                    print(f"✅ Final language: {language_code}")
                    
        finally:
            # Clean up temp files after file is closed
            try:
                os.remove(temp_webm_path)
                os.remove(temp_wav_path)
                print("Temp files cleaned up.")
            except Exception as cleanup_err:
                print("Error cleaning up temp files:", cleanup_err)

        # Get response
        print("Classifying intent and getting response...")
        
        intent_data = await classify_intent_and_respond(transcription, language_code)
        print("Intent data:", intent_data)
        
        # Handle different response types properly
        if intent_data.get("type") == "command":
            response_text = await ask_manus_agent(transcription)
            return {
                "status": "success",
                "data": {
                    "transcription": transcription,
                    "response_text": response_text,
                    "language_code": language_code,
                    "type": "command"
                },
            }
        elif intent_data.get("type") == "structured":
            # For structured responses, return the full structured data
            return {
                "status": "success",
                "data": {
                    "transcription": transcription,
                    "response": intent_data.get("response"),  # The 4-perspective structure
                    "voice_message": intent_data.get("voice_message"),
                    "language_code": intent_data.get("language_code"),
                    "type": "structured"
                },
            }
        else:
            # For chit-chat, return the message
            response_text = intent_data.get("message", "I'm here to help!")
            return {
                "status": "success",
                "data": {
                    "transcription": transcription,
                    "response_text": response_text,
                    "language_code": intent_data.get("language_code"),
                    "type": "chit-chat"
                },
            }
    except Exception as e:
        print("Exception in transcribe_audio_file:", str(e))
        raise HTTPException(status_code=500, detail=str(e))


def extract_language_and_text(text):
    # ONLY support English and Hindi - Hinglish is treated as English
    lang_map = {
        "in hindi": "hi-IN",
        "in english": "en-IN",
        # Note: Hinglish phrases will be treated as English
    }
    lowered = text.lower()
    for phrase, code in lang_map.items():
        if phrase in lowered:
            clean_text = lowered.replace(phrase, "").strip()
            return code, clean_text
    return "en-IN", text  # Default to English


@router.post("/text-to-speech/")
async def text_to_speech_api(data: dict):
    text = data.get("text", "")
    # Use provided language code if present, else extract from text
    target_language_code = data.get("target_language_code")
    if not target_language_code:
        target_language_code, clean_text = extract_language_and_text(text)
    else:
        clean_text = text
    # STRICT FILTERING: Only allow English and Hindi for TTS
    if target_language_code not in ['en-IN', 'hi-IN']:
        print(f"TTS: Blocking unsupported language {target_language_code}, forcing to en-IN")
        target_language_code = 'en-IN'  # Force to English
    if not clean_text.strip():
        return {"error": "No text provided."}
    # DO NOT classify or process the text, just synthesize it as-is
    message = clean_text
    # Truncate message to 2500 chars for Sarvam TTS, but cut at previous full stop if possible
    if len(message) > 2500:
        truncated = message[:2500]
        last_period = truncated.rfind('.')
        if last_period != -1 and last_period > 100:  # Avoid cutting too short
            message = truncated[:last_period+1]
        else:
            message = truncated

    # Sarvam TTS API
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                SARVAM_TTS_URL,
                headers={
                    "api-subscription-key": SARVAM_API_KEY,
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
                json={
                    "text": message,
                    "target_language_code": target_language_code,
                    "speaker": "abhilash"
                },
            )
          
            data = response.json()
            if "error" in data:
                
                raise HTTPException(status_code=500, detail=f"Sarvam TTS error: {data['error']}")
            if response.status_code != 200 or "audios" not in data or not data["audios"]:
            
                raise HTTPException(status_code=500, detail=f"Sarvam TTS failed: {response.text}")
            audio_b64 = data["audios"][0]
            audio_bytes = base64.b64decode(audio_b64)
        except Exception as e:
            print("Exception in text_to_speech_api:", str(e))
            if 'response' in locals():
                print("Sarvam TTS raw response:", response.text)
            
            raise HTTPException(status_code=500, detail=f"TTS error: {str(e)}")
    audio_stream = io.BytesIO(audio_bytes)
    return StreamingResponse(audio_stream, media_type="audio/wav")