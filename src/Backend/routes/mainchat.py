import os
import httpx
from dotenv import load_dotenv
from typing import List, Dict
import json
import re
import random

load_dotenv()
SARVAM_API_KEY = os.getenv("SARVAM_API_KEY")

# Conversation history store
conversation_history: List[Dict] = []

# STRICT function to detect ONLY English, Hinglish, and Hindi (blocks all other languages)
def detect_language_ehh_strict(text, sarvam_detected=None):
    """
    ULTRA-STRICT language detection for English, Hinglish, and Hindi ONLY.
    Completely blocks Telugu, Tamil, and all other regional languages.
    Returns: 'en-IN', 'hi-IN', or 'hinglish'
    """
    # COMPLETELY BLOCK all non-target languages
    blocked_languages = ['te', 'ta', 'kn', 'ml', 'mr', 'gu', 'bn', 'pa', 'ur', 'or', 'as']
    
    if sarvam_detected and any(sarvam_detected.startswith(lang) for lang in blocked_languages):
        sarvam_detected = None  # Completely ignore blocked language detection
    
    # Check if text contains Devanagari script (Hindi)
    def has_devanagari(text):
        return any('\u0900' <= char <= '\u097F' for char in text)
    
    # Check if text has only ASCII characters (likely English/Hinglish)
    def is_ascii_only(text):
        return all(ord(char) < 128 for char in text if char.isalpha())
    
    # Common Hinglish patterns and words
    hinglish_markers = [
        'kaise', 'kya', 'hai', 'hoon', 'aap', 'main', 'tum', 'karo', 'kya hal', 
        'achha', 'thik', 'bas', 'abhi', 'kab', 'kahan', 'kyun', 'kaun', 'kitna',
        'bhai', 'yaar', 'dost', 'sahi', 'galat', 'arre', 'oye', 'dekho', 'suno'
    ]
    
    # Common English words
    english_words = [
        'hello', 'hi', 'how', 'are', 'you', 'what', 'when', 'where', 'why', 'who',
        'good', 'bad', 'yes', 'no', 'okay', 'ok', 'please', 'thank', 'thanks', 'sorry',
        'can', 'could', 'would', 'should', 'will', 'do', 'did', 'does', 'going', 'doing'
    ]
    
    text_lower = text.lower()
    words = text_lower.split()
    
    # Case 1: Contains Devanagari script = Hindi ONLY
    if has_devanagari(text):
        return "hi-IN"
    
    # Case 2: Non-ASCII but not Devanagari = FORCE ENGLISH (block all other scripts)
    if not is_ascii_only(text):
        return "en-IN"
    
    # Case 3: ASCII only - determine English vs Hinglish
    hinglish_count = sum(1 for word in words if word in hinglish_markers)
    english_count = sum(1 for word in words if word in english_words)
    
    if hinglish_count > 0:
        return "en-IN"  # Treat Hinglish as English
    elif english_count > 0:
        return "en-IN"
    
    # Case 4: Only allow Hindi or English from Sarvam
    if sarvam_detected:
        if sarvam_detected.startswith('hi'):
            return "hi-IN"
        elif sarvam_detected.startswith('en'):
            return "en-IN"
    
    # Case 5: DEFAULT FALLBACK - ALWAYS English (NEVER Telugu/Tamil/others)
    return "en-IN"


def get_lang_matched(text, language_code):
    """
    Translate text to the appropriate language for English and Hindi.
    Hinglish is treated as English.
    """
    if not language_code or language_code.startswith('en'):
        return text
    
    # Handle Hindi translation
    if language_code.startswith('hi'):
        try:
            import httpx
            resp = httpx.post(
                "https://api.sarvam.ai/v1/translate",
                headers={"Authorization": f"Bearer {SARVAM_API_KEY}", "Content-Type": "application/json"},
                json={
                    "text": text,
                    "target_language_code": "hi-IN"
                },
                timeout=10.0
            )
            if resp.status_code == 200:
                data = resp.json()
                translated = data.get("translated_text", text)
                print(f"Translated to Hindi: '{text}' → '{translated}'")
                return translated
        except Exception as e:
            print(f"Hindi translation error: {e}")
    
    # Default: return original text (for English/Hinglish)
    return text

def normalize_lang_code(language_code):
    if not language_code:
        return None
    return language_code.split('-')[0]

def detect_explicit_language_request(text: str) -> str:
    """Detects if the user explicitly requests a language from our supported set: English or Hindi."""
    language_map = {
        'hindi': 'hi-IN',
        'english': 'en-IN',
        # Note: Hinglish is treated as English since it uses English script
    }
    import re
    for lang, code in language_map.items():
        # Match phrases like 'in hindi', 'in english', etc.
        if re.search(rf"\\b(in|into|to|say|speak|reply|answer)\\s+(it\\s+)?(in|as)?\\s*{lang}\\b", text, re.IGNORECASE):
            return code
        # Also match 'tell.*hindi', 'answer.*english', etc.
        if re.search(rf"\\b(tell|answer|say|speak).*{lang}\\b", text, re.IGNORECASE):
            return code
    return None

def construct_actionable_voice_message(structured_response):
    """
    Generate a brutally honest, practical, step-by-step action plan for voice_message.
    - Extracts all actionable steps from all sections.
    - Filters and rephrases for directness and clarity.
    - Adds a strong opener and a motivating, no-excuses closer.
    - Generate a personal, connecting voice message that incorporates insights from all four perspectives.
    - Create a holistic message that validates emotions, provides wisdom, shares relatable stories, and gives clear action steps.
    """
    print(f" ENTERING construct_actionable_voice_message function")
    print(f" Input structured_response type: {type(structured_response)}")
    try:
        # Gather all key_points from all sections
        all_steps = []
        for section in ["logical", "psychological", "philosophical", "autobiographical"]:
            if section in structured_response:
                key_points = structured_response[section].get("key_points", [])
                all_steps.extend(key_points)

        # Filter for actionable steps (must contain action verbs)
        action_verbs = [
            "start", "stop", "do", "make", "take", "get", "call", "write", "create", "focus", "work", "try", "begin", "finish", "plan", "schedule", "set", "ask", "tell", "talk", "choose", "decide", "pick", "find", "review", "analyze", "list", "organize", "change", "build", "leave", "quit", "improve", "fix", "overcome", "implement", "apply", "practice", "act", "move"
        ]
        filtered_steps = []
        for step in all_steps:
            step_lower = step.lower()
            if any(verb in step_lower for verb in action_verbs) and len(step) > 10:
                # Keep the full sentence - no truncation in voice message construction
                first_sentence = step.strip()
                
                # Remove soft language but keep the full content
                for soft in ["you should", "try to", "maybe", "perhaps", "consider", "it's important to", "if possible", "could", "might want to"]:
                    first_sentence = first_sentence.replace(soft, "").strip()
                
                # Make sure it starts with a verb
                for verb in action_verbs:
                    if first_sentence.lower().startswith(verb):
                        filtered_steps.append(first_sentence)
                        break
                else:
                    # If not, prepend 'Do this:'
                    filtered_steps.append(f"Do this: {first_sentence}")
        # If not enough steps, fallback to all_steps
        if len(filtered_steps) < 2:
            filtered_steps = [s.split(".")[0].strip() for s in all_steps if len(s) > 10][:3]

        # Build the message
        opener = random.choice([
            "Listen up. No more overthinking.",
            "Here's what you need to do, no excuses:",
            "Stop waiting. Take action:",
            "Cut the drama. Get moving:",
            "Time for real steps, not talk:",
        ])
        conclusion = random.choice([
            "No more analysis. Just do it.",
            "Pick one and start now. No delays.",
            "You want change? Act now.",
            "Excuses don't build dreams. Action does.",
            "That's it. Get to work.",
        ])
        numbered = [f"{i+1}. {step}" for i, step in enumerate(filtered_steps[:3])]
        voice_message = f"{opener} {' '.join(numbered)} {conclusion}"
    
        return voice_message.strip()
    except Exception as e:
        print(f"Error constructing actionable voice message: {e}")
        return "Stop making excuses. Pick one thing and do it now."


async def classify_intent_and_respond(text: str, language_code: str = None) -> Dict:
    # Check for explicit language request in user text
    explicit_lang = detect_explicit_language_request(text)
    if explicit_lang:
        language_code = explicit_lang
    language_code = normalize_lang_code(language_code)
    conversation_history.append({"role": "user", "content": text})
    lower_text = text.lower().strip()
    simple_greetings = ["hi", "hello", "hey", "namaste", "hii"]
    simple_acknowledgements = ["thank you", "thanks", "ok", "okay", "great"]
    
    # Handle name-related questions (expanded with transliterated Hindi)
    name_patterns = [
        "what is your name", "what's your name", "who are you", "your name", 
        "tell me your name", "may i know your name", "can you tell me your name",
        "आपका नाम क्या है", "तुम्हारा नाम क्या है", "आप कौन हैं", "तुम कौन हो",
        # Transliterated/phonetic Hindi variants in Latin script
        "tumhara naam kya hai", "tumhara name kya hai", "aapka naam kya hai", "aapka name kya hai",
        "tumhara naam", "aapka naam", "tumhara name", "aapka name",
        "tum kaun ho", "aap kaun hain", "tum kaun", "aap kaun",
        "naam kya hai", "name kya hai", "naam batao", "name batao",
        "apna naam batao", "apna name batao", "tumhara naam batao", "aapka naam batao",
        # Additional variations with different spellings
        "tumara naam", "tumara name", "aap ka naam", "aap ka name",
        "tera naam", "tera name", "tera naam kya hai", "tera name kya hai"
    ]
    
    if any(pattern in lower_text for pattern in name_patterns):
        msg = get_lang_matched("I am Ruhaan, your AI assistant!", language_code)
        return {"type": "chit-chat", "intent": None, "message": msg, "language_code": language_code}
    
    if lower_text in simple_greetings:
        msg = get_lang_matched("Hello! How can I help you today?", language_code)
        return {"type": "chit-chat", "intent": None, "message": msg, "language_code": language_code}
    elif lower_text in simple_acknowledgements:
        msg = get_lang_matched("You're welcome! Anything else?", language_code)
        return {"type": "chit-chat", "intent": None, "message": msg, "language_code": language_code}

    # Additional chit-chat patterns
    casual_patterns = [
        "how are you", "what's up", "how's it going", "what are you doing",
        "nice to meet you", "good morning", "good afternoon", "good evening",
        "goodbye", "bye", "see you", "take care", "good night", "thanks"
    ]
    
    if any(pattern in lower_text for pattern in casual_patterns):
        msg = get_lang_matched("I'm doing well! How can I assist you today?", language_code)
        return {"type": "chit-chat", "intent": None, "message": msg, "language_code": language_code}

    # --- End Simple message handling ---
    
    # Unified LLM classification for all three types: chit-chat, structured, command
    word_count = len(text.split())
    LONG_PROMPT_THRESHOLD = 12  # Backup threshold for advice-seeking content
    
    # Single comprehensive classification prompt for all three types
    classification_prompt = (
        "You are a smart classifier. Analyze the user's input and classify it into exactly ONE of these three categories:\n\n"
        
        "1. 'command' - Direct, explicit, actionable instructions for:\n"
        "   - Reminders: 'remind me to...', 'set a reminder for 3pm', 'reminder for tomorrow'\n"
        "   - Notes: 'note: buy milk', 'save a note', 'add a note', 'write down that...'\n"
        "   - Goal breakdown: 'break down my project', 'break down task into steps'\n"
        "   - Habit logging: 'log habit: meditation', 'track my habit', 'habit: exercise'\n"
        "   - Quick tasks: 'start a 10-minute timer', 'list my tasks', 'quick task: call mom'\n"
        "   - Browser/Web (English): 'open chrome', 'open browser', 'search google for AI', 'youtube search', 'open website github.com'\n"
        "   - Browser/Web (Hindi): 'गूगल खोलो', 'क्रोम खोलो', 'गूगल पर सर्च करो', 'यूट्यूब खोलो', 'यूट्यूब सर्च करो'\n\n"
        
        "2. 'structured' - Deep questions seeking clarity, advice, or insight about:\n"
        "   - Life decisions (career choices, relationships, major changes)\n"
        "   - Emotional struggles (fear, anxiety, confusion, being stuck)\n"
        "   - Personal growth (purpose, meaning, self-improvement)\n"
        "   - Relationship issues (family, friends, romantic, conflicts)\n"
        "   - Career/work dilemmas (job changes, entrepreneurship, success)\n"
        "   - Money/financial concerns (security, risk, investments)\n"
        "   - Health/wellness challenges (mental, physical, lifestyle)\n"
        "   - Identity/self-worth questions (who am I, am I good enough)\n"
        "   - Future planning (goals, dreams, direction in life)\n"
        "   - Moral/ethical dilemmas (right vs wrong, values conflicts)\n\n"
        
        "3. 'chit-chat' - Everything else:\n"
        "   - Casual conversation, greetings, small talk\n"
        "   - Simple factual questions\n"
        "   - Basic information requests\n"
        "   - Vague requests without specific depth\n\n"
        
        "EXAMPLES:\n"
        "User: 'remind me to call mom at 5pm' → 'command'\n"
        "User: 'open youtube for cooking videos' → 'command'\n"
        "User: 'search google for AI news' → 'command'\n"
        "User: 'open google and search for gym' → 'command'\n"
        "User: 'google and search for restaurants' → 'command'\n"
        "User: 'गूगल खोलो और gym सर्च करो' → 'command'\n"
        "User: 'यूट्यूब पर exercise वाले चैनल बताओ' → 'command'\n"
        "User: 'क्रोम में fitness सर्च करो' → 'command'\n"
        "User: 'search for vaishu uff channel on youtube' → 'command'\n"
        "User: 'find youtube channel vaishu uff' → 'command'\n"
        "User: 'Why am I scared of leaving my job for a startup?' → 'structured'\n"
        
        
        "User: 'How are you today?' → 'chit-chat'\n"
        "User: 'note: buy groceries tomorrow' → 'command'\n"
        "User: 'I feel stuck in my relationship, should I stay?' → 'structured'\n"
        "User: 'What's the weather like?' → 'chit-chat'\n\n"
        
        "Respond ONLY with either 'command', 'structured', or 'chit-chat' - nothing else.\n\n"
        f"User input: {text}"
    )
    
    # Get unified classification from LLM
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            classification_response = await client.post(
                "https://api.sarvam.ai/v1/chat/completions",
                headers={"Authorization": f"Bearer {SARVAM_API_KEY}", "Content-Type": "application/json"},
                json={
                    "model": "sarvam-m",
                    "messages": [{"role": "user", "content": classification_prompt}],
                    "temperature": 0.1,
                    "max_tokens": 10
                },
            )
            classification_data = classification_response.json()
            classification_content = ""
            if "choices" in classification_data:
                classification_content = classification_data.get("choices", [{}])[0].get("message", {}).get("content", "").strip().lower()
            elif "data" in classification_data and isinstance(classification_data["data"], list) and classification_data["data"]:
                classification_content = classification_data["data"][0].get("content", "").strip().lower()
            
            print(f"🤖 LLM Classification: '{classification_content}' for input: '{text[:50]}...'")
            
        except Exception as e:
            print(f"Classification error: {e}, defaulting to chit-chat")
            classification_content = "chit-chat"
    
    # Backup logic for structured questions
    advice_keywords = [
        "advice", "clarity", "help", "guidance", "suggest", "suggestion", "recommend", "recommendation",
        "decision", "problem", "struggle", "should", "why", "how", "stuck", "confused", "purpose",
        "meaning", "direction", "plan", "next step", "next steps", "what should", "what do", "what can",
        "how do", "how can", "change", "improve", "fix", "overcome", "leave", "quit", "start", "build",
        "create", "career", "relationship", "life", "future", "goal", "dream", "resolve", "cope", "deal with",
        "handle", "manage", "uncertain", "uncertainty", "lost", "choice", "choices", "options", "path", "move forward"
    ]
    user_text_lower = text.lower()
    is_advice_seeking = (
        len(user_text_lower.split()) >= 10 and
        any(kw in user_text_lower for kw in advice_keywords)
    )
    if classification_content != "structured" and is_advice_seeking:
        print(f"✅ Override: Detected advice/clarity/decision question, forcing classification to 'structured'")
        classification_content = "structured"

    # Backup logic for commands (just like structured responses)
    command_keywords = [
        "remind", "reminder", "note", "save", "break down", "goal", "habit", "log", "track",
        "timer", "task", "open", "chrome", "browser", "youtube", "google", "search", "website", "channel",
        # Hindi command keywords
        "गूगल", "क्रोम", "यूट्यूब", "सर्च", "खोलो", "खोजो", "ढूंढो", "बताओ", "दिखाओ", "चैनल", "वीडियो"
    ]
    user_text_lower = text.lower()
    is_command_like = any(kw in user_text_lower for kw in command_keywords)
    
    # Override to command if LLM missed it but patterns suggest it's a command
    if classification_content != "command" and is_command_like:
        # Additional check for clear command patterns
        command_patterns = [
            r"remind me ", r"set a reminder", r"note[:] ?", r"save a note",
            r"break down[:] ?", r"log habit[:] ?", r"habit[:] ?",
            r"start a [0-9]+(-minute)? timer", r"list my tasks", r"goal[:] ?",
            r"add (a )?reminder", r"add (a )?note", r"log my habit",
            r"track my habit", r"quick task[:] ?", r"open chrome", r"open browser",
            r"open google", r"google and search", r"youtube", r"google search", r"search google", r"open website", r"open url",
            # Hindi command patterns
            r"गूगल खोलो", r"क्रोम खोलो", r"यूट्यूब खोलो", r"सर्च करो", r"खोजो", r"ढूंढो", r"बताओ", r"दिखाओ"
        ]
        if any(re.search(pat, lower_text) for pat in command_patterns):
            print(f"✅ Override: Detected command patterns, forcing classification to 'command'")
            classification_content = "command"
    
    print(f"🎯 Final classification: {classification_content}") 
    
    # Route based on final classification
    if classification_content == "structured":
        # Use 4-perspective system prompt
        lang_rule = ""
        if language_code:
            lang_rule = f"\n13. ALWAYS reply in the same language as the user's input. The detected language code is: {language_code}."
        system_message = {
            "role": "system",
            "content": (
                "Your name is Ruhaan, an AI assistant focused on mental clarity and practical thinking. You MUST ALWAYS respond in valid JSON format, no exceptions. Your responses should be brutally honest, direct, and in 'roast mode'—no fluff, no sugarcoating, no excessive politeness, and no empty consolation. Respond like a best friend who gives it to you straight, even if it's a little harsh, but always with the user's best interest in mind. In the 'logical' section, you MUST provide clear, specific, and actionable steps—no vague advice, only direct instructions the user can actually follow. You should be witty, sharp, and never afraid to call out the user's excuses or self-deception. Your responses should be concise and fit in a compact box (max 2-3 sentences per section and per key point). If the user asks for further explanation or details, only then expand in the next response. Your responses should be reflective, contextual, and remember past conversations to provide personalized insights. Your primary goal is to help the user gain clarity on their thoughts and feelings and provide actionable steps.\n"
                "\nCRITICAL RULES:\n"
                "1. You MUST ONLY output the JSON object, nothing else.\n"
                "2. NO text before or after the JSON.\n"
                "3. NO explanations or additional comments outside the JSON.\n"
                "4. NO markdown formatting.\n"
                "5. NO code blocks.\n"
                "6. You MUST provide EXACTLY 2 key points for each section, no more and no less.\n"
                "7. Each key point MUST be concise, detailed, and actionable (max 2-3 sentences each, unless user requests more detail).\n"
                "8. NEVER cut off responses in the middle of a sentence.\n"
                "1. Make sure each point provides complete context and actionable insights.\n"
                "11. Keep the main text content for 'analysis', 'perspective', 'story', and 'framework' sections concise and brief, serving as introductions to the key points.\n"
                "12. Ensure the entire response is highly relevant and directly addresses the user's query from all four perspectives."
                f"{lang_rule}" "\n"
                "\nRESPONSE FRAMEWORK:\n"
                "1. Psychological Analysis:\n"
                "   - Provide a deep, empathetic understanding of the user's emotional and cognitive state related to their query.\n"
                "   - Connect current state to potential underlying patterns or past experiences, offering insights into *why* they might be feeling/thinking this way.\n"
                "   - Identify underlying patterns and triggers in their thoughts/feelings.\n"
                "   - Make it personal and contextual, reflecting their input and conversation history.\n"
                "   - **Keep this section's main 'analysis' text brief and to the point.**\n"
                "\n2. Philosophical Perspective:\n"
                "   - Quote specific real philosophers and their exact teachings that directly address the user's situation.\n"
                "   - Use SPECIFIC philosophers like: Socrates (self-knowledge, questioning), Marcus Aurelius (Stoicism), Buddha (suffering, impermanence), Chanakya (strategy, decision-making), Lao Tzu (flow, balance), Epictetus (control), Seneca (time, action), Confucius (relationships, virtue), Rumi (love, purpose).\n"
                "   - ALWAYS include the philosopher's name and their specific quote or principle, not just generic concepts.\n"
                "   - Translate ancient wisdom into modern, practical applications with concrete examples.\n"
                "   - Show how this philosophical insight solves real problems in today's world.\n"
                "   - **Keep this section's main 'perspective' text brief and to the point.**\n"
                "\n3. Autobiographical Insight:\n"
                "   - Share a documented real-life story from published books/biographies that connects to the user's situation.\n"
                "   - ALWAYS use real, published books (biographies, autobiographies, memoirs, business books, self-help books with case studies).\n"
                "   - VARY your book selections - DO NOT repeatedly use the same books. Be creative and choose diverse, relevant books.\n"
                "   - For business queries: use entrepreneur biographies and business case studies.\n"
                "   - For personal growth: use memoirs and self-development books with real examples.\n"
                "   - For relationships: use books with documented relationship insights and real stories.\n"
                "   - Mix well-known and lesser-known books, including international perspectives when relevant.\n"
                "   - Focus on the specific challenge, how the person overcame it, and the practical lesson learned.\n"
                "   - Make it accessible to non-readers by explaining the context and relevance clearly.\n"
                "   - End with a direct connection: 'This applies to your situation because...'.\n"
                "\n4. Logical Framework:\n"
                "   - START with a logical analysis sentence that explains WHY the user's situation exists from a cause-and-effect perspective.\n"
                "   - Break down the user's situation or problem into clear, manageable components.\n"
                "   - Identify core underlying issues vs surface-level symptoms.\n"
                "   - Create concrete, actionable THREE steps the user can take to address the situation. DO NOT be vague—be direct, specific, and tell the user exactly what to do, step by step, as if you are their best friend who doesn't let them off the hook.\n"
                "   - Prioritize steps based on potential impact or ease of implementation.\n"
                "   - Make the steps practical, doable, and easy to understand.\n"
                "   - **You MUST provide exactly 3 key points for the logical section, each representing a specific actionable step.**\n"
                "   - **The 'framework' text should explain the logical cause of the problem and how the steps will solve it.**\n"
                
                "\nExample response format:\n"
                '{\n'
                '    "psychological": {\n'
                '        "analysis": "A deep analysis reflecting empathy and connecting to potential patterns, keep it brief",\n'
                '        "key_points": [\n'
                '            "Detailed point offering insight into cognitive patterns, with a specific example.",\n'
                '            "Empathetic point relating current feelings to past experiences, explaining the connection clearly.",\n'
                '            "Actionable psychological technique to manage a specific thought or emotion, with clear steps."\n'
                '        ]\n'
                '    },\n'
                '    "philosophical": {\n'
                '        "perspective": "Relevant philosophical wisdom from a specific philosopher applied to the user\'s context, keep it brief",\n'
                '        "key_points": [\n'
                '            "[Philosopher Name] said \'[exact quote or principle]\' - explanation of how this ancient wisdom directly addresses the modern problem.",\n'
                '            "Practical application: [specific modern example] - translate the philosophical concept into actionable steps for today\'s world.",\n'
                '            "Why this works: [psychological/logical reasoning] - connect the philosophical wisdom to concrete benefits the user will experience."\n'
                '        ]\n'
                '    },\n'
                '    "autobiographical": {\n'
                '        "story": "In [Book Title] by [Author], [Real Person] faced [similar challenge]. Brief account of what happened and outcome.",\n'
                '        "key_points": [\n'
                '            "The Challenge: Detailed explanation of what [Real Person] was facing and why it relates to the user\'s situation.",\n'
                '            "The Solution: Specific actions taken and strategies used, with practical details that can be applied.",\n'
                '            "The Lesson: Key insight gained and how it directly applies to the user\'s current challenge - \'This applies to your situation because...\'."\n'
                '        ]\n'
                '    },\n'
                '    "logical": {\n'
                '        "framework": "Logical explanation of WHY this problem exists and how these steps will systematically solve it from cause to effect.",\n'
                '        "key_points": [\n'
                '            "Step 1: [Specific action] - detailed instructions on exactly what to do and why this addresses the root cause.",\n'
                '            "Step 2: [Next concrete action] - implementation details and how this builds on step 1 to create momentum.",\n'
                '            "Step 3: [Final systematic step] - how to integrate this into daily routine and measure results for lasting change."\n'
                '        ]\n'
                '    }\n'
                '}'
            )
        }
        messages = [system_message, {"role": "user", "content": text}]
        max_retries = 3
        for attempt in range(max_retries):
            try:
                async with httpx.AsyncClient(timeout=60.0) as client:
                    response = await client.post(
                        "https://api.sarvam.ai/v1/chat/completions",
                        headers={"Authorization": f"Bearer {SARVAM_API_KEY}", "Content-Type": "application/json"},
                        json={
                            "model": "sarvam-m",
                            "messages": messages,
                            "temperature": 0.3,
                            "max_tokens": 2000  # Sarvam's standard limit
                        },
                    )
                data = response.json()
                print(f"[Sarvam API Attempt {attempt+1}] Status: {response.status_code}, Raw: {data}")
                content = ""
                if "choices" in data:
                    content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                elif "data" in data and isinstance(data["data"], list) and data["data"]:
                    content = data["data"][0].get("content", "")
                if content and content.strip():
                    break  # Success
                else:
                    print(f"[Sarvam API Attempt {attempt+1}] Empty content, retrying...")
            except httpx.ReadTimeout:
                print(f"[Sarvam API Attempt {attempt+1}] Timeout, retrying...")
                content = ""
            except Exception as e:
                print(f"[Sarvam API Attempt {attempt+1}] Exception: {e}, retrying...")
                content = ""
        else:
            # All retries failed
            return {"type": "chit-chat", "message": "Sorry, the AI is taking too long or failed to respond. Please try again in a moment.", "language_code": language_code}
        conversation_history.append({"role": "assistant", "content": content})
        def robust_json_parse(s):
            try:
                s = s.strip()
                if s.startswith('```json'):
                    s = s[len('```json'):].strip()
                if s.startswith('```'):
                    s = s[len('```'):].strip()
                if s.endswith('```'):
                    s = s[:-3].strip()
                if (s.startswith('"') and s.endswith('"')) or (s.startswith("'") and s.endswith("'")):
                    s = s[1:-1].strip()
                result = json.loads(s)
                if isinstance(result, str):
                    result = json.loads(result)
                return result
            except Exception as e:
                print(f"Error robust_json_parse (classify): {e}")
                print(f"Failed content (first 500 chars): {s[:500]}")
                # Try to extract partial JSON for structured responses
                if '"psychological"' in s and '"philosophical"' in s:
                    print("Detected partial structured response, attempting repair...")
                    try:
                        # Try to fix common truncation issues
                        if not s.endswith('}'):
                            # More sophisticated repair for structured responses
                            # Try to complete the JSON by closing incomplete sections
                            
                            # Find where each section ends
                            sections = ['psychological', 'philosophical', 'autobiographical', 'logical']
                            section_positions = {}
                            
                            for section in sections:
                                start_pos = s.find(f'"{section}"')
                                if start_pos != -1:
                                    section_positions[section] = start_pos
                            
                            # If we have at least 3 sections, try to repair
                            if len(section_positions) >= 3:
                                # Find the last complete section
                                last_complete_brace = s.rfind('}')
                                if last_complete_brace > 0:
                                    # Check if we need to close the logical section
                                    logical_start = s.find('"logical"')
                                    if logical_start > last_complete_brace:
                                        # Logical section started but didn't finish
                                        # Close it properly
                                        s = s[:last_complete_brace] + '}}}'
                                    else:
                                        # Just close the main object
                                        s = s[:last_complete_brace+1] + '}'
                            else:
                                # Fallback: just close with }}
                                s = s + '}}'
                        
                        result = json.loads(s)
                        print("Successfully repaired JSON!")
                        print(f"Repaired JSON sections: {list(result.keys())}")
                        return result
                    except Exception as repair_e:
                        print(f"JSON repair failed: {repair_e}")
                        # Try even simpler repair - just close with multiple braces
                        try:
                            simple_repair = s + '}}}'
                            result = json.loads(simple_repair)
                            print("Simple repair worked!")
                            return result
                        except:
                            print("Simple repair also failed")
                return None
        structured_response = robust_json_parse(content)
        if structured_response:
            print(f" Parsed JSON sections: {list(structured_response.keys())}")
            required_sections = ["psychological", "philosophical", "autobiographical", "logical"]
            missing_sections = [s for s in required_sections if s not in structured_response]
            if missing_sections:
                print(f" Missing required sections: {missing_sections}")
            
            if all(section in structured_response for section in required_sections):
                # Build a summary and next steps
                summary_parts = []
                # Add main summaries from each section
                summary_parts.append("Psychological: " + structured_response["psychological"].get("analysis", ""))
                summary_parts.append("Philosophical: " + structured_response["philosophical"].get("perspective", ""))
                summary_parts.append("Autobiographical: " + structured_response["autobiographical"].get("story", ""))
                summary_parts.append("Logical: " + structured_response["logical"].get("framework", ""))
                summary = " ".join(summary_parts)
                
                # Next steps: use logical key_points if available, else fallback to all key_points
                next_steps = structured_response["logical"].get("key_points", [])
                if not next_steps:
                    # Fallback: collect all key_points
                    next_steps = []
                    for sec in required_sections:
                        next_steps.extend(structured_response[sec].get("key_points", []))
                next_steps_text = " ".join(next_steps)
                
                # ALWAYS generate action-only voice message using our constructor
                # Never trust LLM-generated voice messages as they contain summaries
                print(f" About to call construct_actionable_voice_message with structured_response")
                print(f" Structured response keys: {list(structured_response.keys())}")
                voice_message = construct_actionable_voice_message(structured_response)
               
                # Validate autobiographical section contains proper book reference
                if "autobiographical" in structured_response:
                    auto_content = str(structured_response["autobiographical"])
                    # Check for specific book/author format requirements
                    has_book_title = any(indicator in auto_content.lower() for indicator in [
                        'in ', 'book', 'by ', 'author', 'steve jobs', 'shoe dog', 'lean startup', 
                        'becoming', 'educated', 'walter isaacson', 'phil knight', 'eric ries',
                        'michelle obama', 'tara westover', 'biography', 'memoir'
                    ])
                    has_proper_format = 'by ' in auto_content and ('In ' in auto_content or 'in ' in auto_content)
                    
                    if not has_book_title or not has_proper_format:
                        print("Warning: autobiographical section missing proper book title/author format")
                        print(f"Content: {auto_content[:200]}...")  # Debug output
                
                # Add to response
                return {
                    "type": "structured",
                    "response": structured_response,
                    "summary": get_lang_matched(summary.strip(), language_code),
                    "next_steps": get_lang_matched(next_steps_text.strip(), language_code),
                    "voice_message": get_lang_matched(voice_message.strip(), language_code),  # Add voice message
                    "language_code": language_code
                }
            else:
                fallback_message = None

                for v in structured_response.values():
                    if isinstance(v, str) and len(v) > 10:
                        fallback_message = v
                        break
                    elif isinstance(v, dict):
                        for vv in v.values():
                            if isinstance(vv, str) and len(vv) > 10:
                                fallback_message = vv
                                break
                        if fallback_message:
                            break                
                if fallback_message:
                    return {"type": "chit-chat", "message": get_lang_matched(fallback_message, language_code), "language_code": language_code}
        else:
            # Classification was "structured" but JSON parsing failed
            print("❌ Structured response expected but JSON parsing failed")
            print(f"Raw content: {content[:200]}...")
            
            # Special handling for failed structured responses
            return {
                "type": "chit-chat", 
                "message": get_lang_matched(
                    "I tried to give you a detailed analysis, but there was a formatting issue. Let me know if you'd like me to try again with your question.",
                    language_code
                ), 
                "language_code": language_code
            }
    
    elif classification_content == "command":
        # Handle command - delegate to agent/MCP
        return {
            "type": "command",
            "intent": "agent_task",  # Will be processed by agent
            "message": "Processing your command...",
            "language_code": language_code
        }
    
    else:  # chit-chat or fallback
        # Handle casual conversation
        chit_chat_prompt = (
            "You are a helpful, friendly AI assistant. The user is making casual conversation or chit-chat. "
            "Reply with a direct, contextually appropriate, natural-sounding sentence. "
            "DO NOT return a JSON object, list, or any structured data. DO NOT include any code blocks, markdown, or extra formatting. "
            "Just reply with a single, plain string that is suitable for both chat and TTS."
        )
        messages = [
            {"role": "system", "content": chit_chat_prompt},
            {"role": "user", "content": text}
        ]
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.sarvam.ai/v1/chat/completions",
                headers={"Authorization": f"Bearer {SARVAM_API_KEY}", "Content-Type": "application/json"},
                json={
                    "model": "sarvam-m",
                    "messages": messages,
                    "temperature": 0.3
                },
            )
            data = response.json()
            content = ""
            if "choices" in data:
                content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
            elif "data" in data and isinstance(data["data"], list) and data["data"]:
                content = data["data"][0].get("content", "")
            if not content or not content.strip():
                msg = get_lang_matched("I'm here to help! What's on your mind?", language_code)
            else:
                msg = get_lang_matched(content.strip(), language_code)
            return {"type": "chit-chat", "intent": None, "message": msg, "language_code": language_code}

async def chat_with_groq(message: str, language_code: str = None) -> Dict:
    """Simplified function that just delegates to classify_intent_and_respond"""
    return await classify_intent_and_respond(message, language_code)
