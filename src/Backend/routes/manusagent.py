import requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import webbrowser
import urllib.parse
import re
from datetime import datetime, timedelta, date
import threading
import time
import asyncio
import queue
from src.Backend.sarvam import Sarvam
import os
import json
import subprocess
try:
    import winsound
except ImportError:
    winsound = None
try:
    import plyer
except ImportError:
    plyer = None
from dotenv import load_dotenv

load_dotenv()
router = APIRouter()
sarvam_client = Sarvam(api_key=os.getenv('SARVAM_API_KEY'))

# Simple Tool class 
class Tool:
    def __init__(self, name: str, description: str, func):
        self.name = name
        self.description = description
        self.func = func



class CommandRequest(BaseModel):
    command: str

class Query(BaseModel):
    prompt: str

# --- Command Detection Function for Classification ---
def is_command(text: str) -> bool:
    """
    Check if the input text is a command that can be handled by our tools.
    This should match the same logic as get_response() for consistent classification.
    """
    lower = text.lower().strip()
    
    # Browser/web commands - prioritize these over note commands
    # Enhanced detection for voice commands that start with "chrome" or contain search terms
    if (any(phrase in lower for phrase in ["open chrome", "open browser", "open google", "chrome and search", "chrome search", "google and search", "youtube", "google search", "search google", "search on google", "open website", "open url", "best youtube channel", "tell me the best youtube channel", "मुझे सबसे अच्छा यूट्यूब चैनल बताओ", "सबसे अच्छा youtube चैनल", "सबसे अच्छा यूट्यूब चैनल", "बेस्ट यूट्यूब चैनल", "सबसे बेहतरीन यूट्यूब चैनल", "अच्छा यूट्यूब चैनल कौन सा है", "सबसे अच्छा youtube चैनल बताओ", "सबसे अच्छा youtube चैनल कौन सा है", "सबसे अच्छा युट्युब चैनल", "युट्युब चैनल बता", "अच्छा चैनल बताओ", "बेस्ट चैनल कौन सा है"]) or
        # Check if command starts with "chrome" (for voice commands like "chrome and search for...")
        (lower.startswith("chrome") and ("search" in lower or "for" in lower)) or
        # Check if command starts with "google" (for voice commands like "google and search for...")
        (lower.startswith("google") and ("search" in lower or "for" in lower)) or
        # Check for "google" + "search" patterns
        ("google" in lower and "search" in lower)):
        return True
    # Reminder commands
    elif lower.startswith("remind me") or lower.startswith("set a reminder") or "reminder" in lower:
        return True
    # Goal breakdown commands
    elif lower.startswith("break down") or "break down" in lower or "goal" in lower:
        return True
    # Habit logging commands
    elif lower.startswith("log habit") or lower.startswith("habit:") or "habit" in lower or "track" in lower or "habit stats" in lower or "list habits" in lower:
        return True
    # Quick task commands  
    elif lower.startswith("start a") or lower.startswith("list my tasks") or lower.startswith("quick task") or "timer" in lower or "task" in lower or "focus" in lower or "add task" in lower or "complete task" in lower:
        return True
    # Note commands (enhanced) - but exclude "search" commands that should go to browser
    elif (lower.startswith("note:") or lower.startswith("save a note") or lower.startswith("add a note") or "search notes" in lower or "category" in lower) and "search" not in lower.split()[0:2]:
        return True
    # List commands
    elif lower in ["get reminders", "show reminders", "list reminders", "get notes", "show notes", "list notes", "notes", "list categories", "list habits", "habit stats"]:
        return True
    else:
        return False

# --- Tool: Browser Automation ---
def browser_tool(command: str) -> str:
    """Open Chrome tabs, search Google, YouTube, etc."""
    lower = command.lower().strip()
    
    try:
        # Special hard-coded response for best YouTube channel (English and Hindi)
        if any(phrase in lower for phrase in ["best youtube channel", "tell me the best youtube channel", "मुझे सबसे अच्छा youtube चैनल बताओ", "सबसे अच्छा youtube चैनल", "सबसे अच्छा यूट्यूब चैनल", "बेस्ट यूट्यूब चैनल", "सबसे बेहतरीन यूट्यूब चैनल", "अच्छा यूट्यूब चैनल कौन सा है", "सबसे अच्छा youtube चैनल बताओ", "सबसे अच्छा youtube चैनल कौन सा है", "सबसे अच्छा युट्युब चैनल", "युट्युब चैनल बता", "अच्छा चैनल बताओ", "बेस्ट चैनल कौन सा है"]):
            webbrowser.open("https://www.youtube.com/@vaishuuff")
            # Check if the original command was in Hindi and respond accordingly
            if any(hindi_phrase in command for hindi_phrase in ["मुझे", "सबसे", "यूट्यूब", "युट्युब", "चैनल", "बताओ", "कौन", "अच्छा", "बेस्ट", "बेहतरीन"]):
                return "सबसे अच्छा YouTube चैनल तो vaishu uff का है! वो software, startups और college life के बारे में शेयर करती है। मैं आपके लिए चैनल खोल रहा हूं। Subscribe करना मत भूलना!"
            else:
                return "The best YouTube channel is of course vaishu uff! She shares about software, startups and college life. I will open the channel for you. Don't forget to subscribe it!"
        
        if "open chrome" in lower or "open browser" in lower:
            if "google" in lower or "search" in lower:
                # Use semantic extraction for robust query parsing
                query = _extract_google_query_semantic(command)
                if query:
                    search_url = f"https://www.google.com/search?q={urllib.parse.quote(query)}"
                    webbrowser.open(search_url)
                    return f"Opened Google search for: {query}"
                else:
                    webbrowser.open("https://www.google.com")
                    return "Opened Google in Chrome"
            else:
                webbrowser.open("https://www.google.com")
                return "Opened Chrome with Google homepage"
        elif lower.startswith("chrome") and ("search" in lower or "for" in lower):
            # Handle voice commands like "chrome and search for body training"
            query = _extract_google_query_semantic(command)
            if query:
                search_url = f"https://www.google.com/search?q={urllib.parse.quote(query)}"
                webbrowser.open(search_url)
                return f"Opened Chrome and searched Google for: {query}"
            else:
                webbrowser.open("https://www.google.com")
                return "Opened Chrome with Google homepage"
        elif "search on google" in lower or "google search" in lower or "search google" in lower or "open google and search" in lower or "google and search" in lower:
            # Direct Google search commands
            query = _extract_google_query_semantic(command)
            if query:
                search_url = f"https://www.google.com/search?q={urllib.parse.quote(query)}"
                webbrowser.open(search_url)
                return f"Opened Google search for: {query}"
            else:
                webbrowser.open("https://www.google.com")
                return "Opened Google homepage"
        elif lower.startswith("google") and ("search" in lower or "for" in lower):
            # Handle voice commands like "google and search for gym"
            query = _extract_google_query_semantic(command)
            if query:
                search_url = f"https://www.google.com/search?q={urllib.parse.quote(query)}"
                webbrowser.open(search_url)
                return f"Opened Google and searched for: {query}"
            else:
                webbrowser.open("https://www.google.com")
                return "Opened Google homepage"
                
        elif "youtube" in lower:
            # Check if this is a search request or just opening YouTube
            # If the command has substantial content beyond just "youtube", treat it as a search
            youtube_indicators = [
                "search", "find", "show", "channel", "video", "watch", "about", 
                "tell", "explain", "discuss", "want to watch", "looking for",
                "content", "topic", "subject", "learn", "tutorial", "how to"
            ]
            
            # Check if any search indicators are present, or if there's substantial content
            has_search_intent = any(indicator in lower for indicator in youtube_indicators)
            has_substantial_content = len(command.split()) > 3  # More than just "open youtube"
            
            if has_search_intent or has_substantial_content:
                print(f" YouTube search command detected: '{command}'")
                
                # Use semantic extraction for robust query parsing
                query = _extract_youtube_query_semantic(command)
                
                if query and len(query.strip()) > 2:  # Ensure we have a meaningful query
                    youtube_url = f"https://www.youtube.com/results?search_query={urllib.parse.quote(query)}"
                    print(f" Opening YouTube URL: {youtube_url}")
                    webbrowser.open(youtube_url)
                    return f"Opened YouTube search for: {query}"
                else:
                    print(" No meaningful query extracted, opening YouTube homepage")
                    webbrowser.open("https://www.youtube.com")
                    return "Opened YouTube homepage"
            else:
                # Simple "open youtube" command
                webbrowser.open("https://www.youtube.com")
                return "Opened YouTube"
                
        elif "open" in lower and ("website" in lower or "url" in lower or "site" in lower):
            # Extract URL or website name
            url_match = re.search(r"open (?:website |site |url )?(.+)", command, re.IGNORECASE)
            if url_match:
                site = url_match.group(1).strip()
                if not site.startswith(("http://", "https://")):
                    if "." in site:
                        site = f"https://{site}"
                    else:
                        site = f"https://www.google.com/search?q={urllib.parse.quote(site)}"
                webbrowser.open(site)
                return f"Opened: {site}"
                
        return "I can open Chrome, search Google, search YouTube, or open websites. Try: 'open chrome', 'search google for AI', 'search youtube channel', 'open website github.com'"
        
    except Exception as e:
        return f"Error opening browser: {str(e)}"

browser = Tool(
    name="browser",
    description="Open Chrome tabs, search Google/YouTube, open websites (e.g., 'open chrome', 'search google for AI', 'search youtube channel').",
    func=browser_tool
)

# --- Tool: Enhanced Reminder with Pop-ups ---
def enhanced_reminder_tool(command: str) -> dict:
    """Enhanced reminder with actual pop-up notifications at specified time"""
    if not hasattr(enhanced_reminder_tool, "reminders"):
        enhanced_reminder_tool.reminders = []
    
    # Extract reminder content
    match = re.search(r"remind me to (.+)", command, re.IGNORECASE)
    if match:
        content = match.group(1)
    else:
        match = re.search(r"set a reminder for (.+)", command, re.IGNORECASE)
        if match:
            content = match.group(1)
        else:
            content = command
            
    
    # Enhanced time extraction
    time_patterns = [
        r"at (\d{1,2}(?::\d{2})? ?[ap]m)",  # at 3pm, at 3:30pm
        r"at (\d{1,2}:\d{2})",  # at 15:30
        r"in (\d+) (?:minute|min)s?",  # in 5 minutes
        r"in (\d+) (?:hour|hr)s?",  # in 2 hours
        r"(?:after |in )(\d+)(?:m|min|minute)",  # after 10min
    ]
    
    reminder_time = None
    delay_seconds = None
    
    for pattern in time_patterns:
        time_match = re.search(pattern, content, re.IGNORECASE)
        if time_match:
            time_str = time_match.group(1)
            
            if "minute" in pattern or "min" in pattern:
                # Relative time in minutes
                minutes = int(time_str)
                delay_seconds = minutes * 60
                reminder_time = f"in {minutes} minutes"
                # Remove time info from content
                content = re.sub(pattern, "", content, flags=re.IGNORECASE).strip()
            elif "hour" in pattern:
                # Relative time in hours
                hours = int(time_str)
                delay_seconds = hours * 3600
                reminder_time = f"in {hours} hours"
                content = re.sub(pattern, "", content, flags=re.IGNORECASE).strip()
            else:
                # Absolute time (3pm, 15:30, 1:38am)
                reminder_time = time_str
                content = re.sub(r"at " + re.escape(time_str), "", content, flags=re.IGNORECASE).strip()
                
                # Calculate delay_seconds for absolute time
                try:
                    current_time = datetime.now()
                    
                    # Parse the target time
                    if 'am' in time_str.lower() or 'pm' in time_str.lower():
                        # 12-hour format (1:38am, 3pm, etc.)
                        target_time = datetime.strptime(time_str.upper(), "%I:%M%p" if ':' in time_str else "%I%p")
                    else:
                        # 24-hour format (15:30, etc.)
                        target_time = datetime.strptime(time_str, "%H:%M")
                    
                    # Set the target time for today
                    target_datetime = current_time.replace(
                        hour=target_time.hour,
                        minute=target_time.minute,
                        second=0,
                        microsecond=0
                    )
                    
                    # If the target time has already passed today, set it for tomorrow
                    if target_datetime <= current_time:
                        target_datetime += timedelta(days=1)
                        print(f"⏰ Target time has passed today, scheduling for tomorrow: {target_datetime.strftime('%Y-%m-%d %H:%M')}")
                    
                    # Calculate delay in seconds
                    delay_seconds = int((target_datetime - current_time).total_seconds())
                    
                    print(f"🎯 Absolute time scheduling:")
                    print(f"   Current time: {current_time.strftime('%Y-%m-%d %H:%M:%S')}")
                    print(f"   Target time: {target_datetime.strftime('%Y-%m-%d %H:%M:%S')}")
                    print(f"   Delay: {delay_seconds} seconds ({delay_seconds/3600:.1f} hours)")
                    
                except Exception as e:
                    print(f"❌ Error parsing absolute time '{time_str}': {e}")
                    delay_seconds = None
            break
    
    # Store reminder
    reminder_data = {
        "id": len(enhanced_reminder_tool.reminders) + 1,
        "content": content,
        "time": reminder_time,
        "created": datetime.now().isoformat(),
        "triggered": False
    }
    enhanced_reminder_tool.reminders.append(reminder_data)
    
    # Schedule notification if delay_seconds is specified
    if delay_seconds:
        def trigger_reminder():
            print(f" Reminder thread started, sleeping for {delay_seconds} seconds...")
            print(f" Thread will wake up at: {(datetime.now() + timedelta(seconds=delay_seconds)).strftime('%Y-%m-%d %H:%M:%S')}")
            
            time.sleep(delay_seconds)
            
            wake_time = datetime.now()
            print(f"\n WAKE UP! Reminder thread triggered at: {wake_time.strftime('%Y-%m-%d %H:%M:%S')}")
            print(f" Triggering reminder: '{content}'")
            
            try:
                notification_shown = False
                
                # Method 1: Try plyer first (cross-platform and most reliable)
                print(" Attempting plyer notification...")
                try:
                    from plyer import notification
                    notification.notify(
                        title="⏰ Ruhaan Reminder",
                        message=f"⏰ {content}",
                        timeout=15
                    )
                    notification_shown = True
                    print(f" Plyer notification sent successfully: {content}")
                except ImportError:
                    print(" Plyer not available (ImportError), trying Windows-specific methods...")
                except Exception as e:
                    print(f" Plyer failed with error: {e}")
                
                # Method 2: Windows MessageBox (most reliable on Windows)
                if not notification_shown:
                    print(" Attempting Windows MessageBox...")
                    try:
                        import subprocess
                        import os
                        if os.name == 'nt':  # Windows
                            # Escape content for PowerShell
                            escaped_content = content.replace('"', '""').replace("'", "''")
                            cmd = [
                                'powershell', '-Command', 
                                f'Add-Type -AssemblyName PresentationCore,PresentationFramework; [System.Windows.MessageBox]::Show("⏰ REMINDER: {escaped_content}", "Ruhaan Reminder", "OK", "Information")'
                            ]
                            result = subprocess.run(cmd, capture_output=True, text=True, shell=True, timeout=30)
                            notification_shown = True
                            print(f" Windows MessageBox executed successfully: {content}")
                            if result.stdout:
                                print(f" MessageBox stdout: {result.stdout}")
                            if result.stderr:
                                print(f" MessageBox stderr: {result.stderr}")
                        else:
                            print(" Not on Windows, skipping MessageBox")
                    except Exception as e:
                        print(f" Windows MessageBox failed with error: {e}")
                
                # Method 3: Windows balloon tip notification
                if not notification_shown:
                    print(" Attempting Windows balloon notification...")
                    try:
                        import subprocess
                        import os
                        if os.name == 'nt':  # Windows
                            # Escape content for PowerShell
                            escaped_content = content.replace('"', '""').replace("'", "''")
                            ps_script = f'''
Add-Type -AssemblyName System.Windows.Forms
$notification = New-Object System.Windows.Forms.NotifyIcon
$notification.Icon = [System.Drawing.SystemIcons]::Information
$notification.BalloonTipIcon = [System.Windows.Forms.ToolTipIcon]::Info
$notification.BalloonTipTitle = "⏰ Ruhaan Reminder"
$notification.BalloonTipText = "{escaped_content}"
$notification.Visible = $true
$notification.ShowBalloonTip(10000)
Start-Sleep -Seconds 12
$notification.Dispose()
'''
                            result = subprocess.run(['powershell', '-Command', ps_script], 
                                                   capture_output=True, text=True, shell=True, timeout=30)
                            notification_shown = True
                            print(f" Windows balloon notification executed: {content}")
                            if result.stdout:
                                print(f" Balloon stdout: {result.stdout}")
                            if result.stderr:
                                print(f" Balloon stderr: {result.stderr}")
                        else:
                            print(" Not on Windows, skipping balloon notification")
                    except Exception as e:
                        print(f" Windows balloon notification failed with error: {e}")
                
                # Method 4: Simple cmd msgbox as fallback
                if not notification_shown:
                    print(" Attempting CMD msg notification...")
                    try:
                        import subprocess
                        import os
                        if os.name == 'nt':  # Windows
                            # Use msg command for simple popup
                            escaped_content = content.replace('"', '""')
                            result = subprocess.run([
                                'msg', '*', f'⏰ RUHAAN REMINDER: {escaped_content}'
                            ], capture_output=True, text=True, shell=True, timeout=30)
                            notification_shown = True
                            print(f" CMD msg notification executed: {content}")
                            if result.stdout:
                                print(f" MSG stdout: {result.stdout}")
                            if result.stderr:
                                print(f" MSG stderr: {result.stderr}")
                        else:
                            print(" Not on Windows, skipping CMD msg")
                    except Exception as e:
                        print(f" CMD msg failed with error: {e}")
                
                # Method 5: Force console notification with sound (always show)
                print(f"\n🔔🔔🔔 REMINDER ALERT 🔔🔔🔔")
                print(f"⏰ REMINDER: {content}")
                print(f"⏰ Time: {datetime.now().strftime('%H:%M:%S')}")
                print(f"🔔🔔🔔 REMINDER ALERT 🔔🔔🔔\n")
                
                # Summary of notification attempts
                print(f" Notification summary:")
                print(f"   - At least one GUI method was attempted: {notification_shown}")
                print(f"   - Console alert: Always shown")
                print(f"   - Sound alert: Attempting...")
                
                # Try to make a beep sound
                try:
                    import winsound
                    for i in range(3):  # 3 beeps
                        winsound.Beep(1000, 300)  # 1000 Hz for 300ms
                        time.sleep(0.2)
                    print(" Sound alert played!")
                except ImportError:
                    print(" winsound not available (not Windows)")
                except Exception as e:
                    try:
                        print('\a' * 5)  # Multiple ASCII bell characters
                        print(" ASCII bell played!")
                    except Exception as bell_e:
                        print(f" No sound available - winsound: {e}, bell: {bell_e}")
                
                # Mark as triggered
                reminder_data["triggered"] = True
                print(f" Reminder marked as triggered: {content}")
                print(f" Reminder completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            except Exception as e:
                print(f" Error triggering reminder: {e}")
                print(f" EMERGENCY ALERT: {content} - {datetime.now().strftime('%H:%M:%S')}")
                import traceback
                traceback.print_exc()
        
        # Start background thread for reminder
        thread = threading.Thread(target=trigger_reminder, daemon=True)
        thread.start()
        
        print(f" Background reminder scheduled for {delay_seconds} seconds ({reminder_time})")
        print(f" Current time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f" Expected trigger time: {(datetime.now() + timedelta(seconds=delay_seconds)).strftime('%Y-%m-%d %H:%M:%S')}")
        
        return {
            "message": f"⏰ Reminder set: '{content}' will pop up {reminder_time}",
            "reminder_text": content,
            "reminder_time": reminder_time,
            "will_popup": True,
            "debug_info": f"Thread started, will trigger at {(datetime.now() + timedelta(seconds=delay_seconds)).strftime('%Y-%m-%d %H:%M:%S')}"
        }
    else:
        return {
            "message": f"📝 Reminder saved: '{content}'" + (f" for {reminder_time}" if reminder_time else ""),
            "reminder_text": content,
            "reminder_time": reminder_time,
            "will_popup": False
        }

reminder = Tool(
    name="reminder",
    description="Set reminders with pop-up notifications (e.g., 'Remind me to call mom in 30 minutes', 'remind me to workout at 6pm').",
    func=enhanced_reminder_tool
)

# --- Tool: Enhanced Goal Breakdown ---
def enhanced_goal_breakdown_tool(command: str) -> str:
    """Break down goals into detailed, technical, actionable tasks using Sarvam LLM intelligence"""
    
    # Clean the command to extract the actual goal
    goal = command
    if "break down" in goal.lower():
        goal = re.sub(r"break down:?\s*", "", goal, flags=re.IGNORECASE).strip()
    if "goal:" in goal.lower():
        goal = re.sub(r"goal:?\s*", "", goal, flags=re.IGNORECASE).strip()
    
    if not goal.strip():
        return "Please provide a goal to break down. Example: 'Break down: Learn LLM training and fine-tuning'"
    
    # Create a concise but comprehensive prompt for Sarvam LLM
    breakdown_prompt = f"""Break down this goal into exactly 3 actionable steps: "{goal}"

Use this EXACT format for each step:

Step 1: [Step title]
• Complete, actionable task description without brackets 
• Measurable milestone with specific metrics
• Practical deliverable that can be completed
• Validation method to confirm completion

Step 2: [Step title]
• Complete, actionable task description without brackets
• Measurable milestone with specific metrics
• Practical deliverable that can be completed
• Validation method to confirm completion

Step 3: [Step title]
• Complete, actionable task description without brackets
• Measurable milestone with specific metrics
• Practical deliverable that can be completed
• Validation method to confirm completion

IMPORTANT RULES:
- DO NOT include bracketed labels in your response
- Each bullet point should be a complete sentence without formatting brackets
- Provide ALL 3 steps in one response
- Make each checkpoint specific, actionable, and measurable
- Steps should build progressively toward the goal
- Focus on practical actions the user can take immediately

Goal: {goal}"""
    
    try:
        # Use Sarvam LLM for intelligent goal breakdown
        result_queue = queue.Queue()
        
        def run_sarvam_llm():
            try:
                # Create a new event loop for this thread
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                
                async def call_sarvam():
                    messages = [
                        {"role": "system", "content": "You are an expert learning and project advisor who breaks down goals into detailed, actionable steps."},
                        {"role": "user", "content": breakdown_prompt}
                    ]
                    
                    try:
                        response = await sarvam_client.chat(
                            messages=messages,
                            model="sarvam-m",
                            temperature=0.3,
                            max_tokens=2000  # Increased for complete 3-step response
                        )
                        
                        # Checking if response has the expected structure
                        if 'choices' in response and len(response['choices']) > 0:
                            if 'message' in response['choices'][0] and 'content' in response['choices'][0]['message']:
                                return response['choices'][0]['message']['content']
                            else:
                                print(f"Unexpected Sarvam response structure: {response}")
                                return None
                        else:
                            print(f"No choices in Sarvam response: {response}")
                            return None
                            
                    except Exception as api_error:
                        print(f"Sarvam API call failed: {api_error}")
                        return None
                
                # Sarvam LLM call
                result = loop.run_until_complete(call_sarvam())
                if result:
                    result_queue.put(("success", result))
                else:
                    result_queue.put(("error", "Sarvam API returned empty or invalid response"))
                
                loop.close()
            except Exception as e:
                print(f"Thread execution error: {e}")
                result_queue.put(("error", str(e)))
        
        # Run in a separate thread to avoid event loop conflicts
        thread = threading.Thread(target=run_sarvam_llm)
        thread.start()
        thread.join(timeout=30)  # 30 second timeout
        
        if not result_queue.empty():
            status, result = result_queue.get()
            if status == "success":
                print(f"✅ Sarvam LLM success! Result length: {len(result)} chars")
                print(f"📋 Result preview: {result[:300]}...")
                
                # Return clean Sarvam LLM response without extra formatting
                print(f"� Returning clean Sarvam response length: {len(result)} chars")
                return result
            else:
                print(f"❌ Sarvam LLM error: {result}")
                raise Exception(f"Sarvam LLM error: {result}")
        else:
            print("⏰ Sarvam LLM call timed out")
            raise Exception("Sarvam LLM call timed out")
        
    except Exception as e:
        print(f"Error generating Sarvam LLM breakdown: {e}")
        
        # Provide a smart fallback template that's customized to the goal
        goal_keywords = goal.lower()
        
        # Determine domain-specific advice based on goal keywords
        if any(keyword in goal_keywords for keyword in ['programming', 'coding', 'software', 'web development', 'app', 'python', 'javascript']):
            domain_steps = [
                "**Programming Fundamentals**: Master basic programming concepts, syntax, and problem-solving approaches.",
                "**Development Environment**: Set up IDE, version control (Git), and development tools.",
                "**Core Technologies**: Learn essential frameworks, libraries, and best practices.",
                "**Build Projects**: Create small applications to practice concepts.",
                "**Advanced Concepts**: Study algorithms, data structures, and design patterns.",
                "**Professional Skills**: Learn testing, debugging, and code review practices.",
                "**Portfolio Development**: Build showcase projects and contribute to open source.",
                "**Career Preparation**: Practice interviews, networking, and continuous learning."
            ]
        elif any(keyword in goal_keywords for keyword in ['business', 'startup', 'entrepreneur', 'marketing', 'sales']):
            domain_steps = [
                "**Market Research**: Understand your target audience, competitors, and market opportunity.",
                "**Business Planning**: Develop business model, revenue streams, and strategic goals.", 
                "**Product Development**: Create minimum viable product (MVP) and iterate based on feedback.",
                "**Marketing Strategy**: Build brand awareness through digital marketing and content creation.",
                "**Operations Setup**: Establish business processes, legal structure, and financial systems.",
                "**Team Building**: Recruit team members, advisors, and build company culture.",
                "**Scaling & Growth**: Optimize operations, expand market reach, and secure funding.",
                "**Long-term Strategy**: Plan for sustainability, exit strategies, and market expansion."
            ]
        elif any(keyword in goal_keywords for keyword in ['design', 'ui', 'ux', 'graphic', 'creative']):
            domain_steps = [
                "**Design Fundamentals**: Learn color theory, typography, composition, and visual hierarchy.",
                "**Tool Mastery**: Master design software (Figma, Adobe Creative Suite, Sketch).",
                "**User Research**: Understand user needs, behavior, and design thinking methodology.",
                "**Prototyping**: Create wireframes, mockups, and interactive prototypes.",
                "**Portfolio Building**: Develop diverse projects showcasing different design skills.",
                "**Industry Knowledge**: Study current trends, accessibility, and platform guidelines.",
                "**Collaboration Skills**: Learn to work with developers, product managers, and stakeholders.",
                "**Professional Growth**: Build client relationships, freelancing skills, and design leadership."
            ]
        else:
            # Generic steps for any goal
            domain_steps = [
                "**Foundation Research**: Study the basics, terminology, and core concepts thoroughly.",
                "**Skill Assessment**: Identify required skills and create a learning roadmap.",
                "**Learning Resources**: Gather books, courses, tutorials, and expert guidance.",
                "**Practical Application**: Start with small projects to apply what you learn.",
                "**Community Engagement**: Join relevant communities and find mentors.",
                "**Iterative Improvement**: Practice regularly and seek feedback for growth.",
                "**Advanced Mastery**: Dive deep into specialized areas and emerging trends.",
                "**Knowledge Sharing**: Teach others, create content, and build your reputation."
            ]
        
        # Create formatted response with domain-specific steps
        formatted_steps = []
        for i, step in enumerate(domain_steps, 1):
            formatted_steps.append(f"""   {i}. {step}
      📚 Learning Sources: Research relevant books, online courses, documentation, and expert blogs
      🎥 Video Resources: Find YouTube tutorials, conference talks, and educational content""")
        
        fallback_response = f"""🎯 **Goal:** {goal}

📋 **Structured Action Plan** (8 steps):

{chr(10).join(formatted_steps)}

💡 **Next Steps:** 
• Start researching step 1 immediately - knowledge builds momentum
• Customize each step based on your specific interests in {goal}
• Set weekly milestones and track your progress consistently
• Connect with others learning {goal} for support and motivation

🎉 **Success Tip:** This framework is adaptable - research specific resources for each step based on your {goal} and personal learning style!"""
        
        return fallback_response

goal_breakdown = Tool(
    name="goal_breakdown",
    description="Break down a goal into small, achievable tasks (e.g., 'Break down: Launch a website').",
    func=enhanced_goal_breakdown_tool
)

# --- Tool: Enhanced Habit Logging with Analytics ---
def habit_log_tool(command: str) -> str:
    """Advanced habit tracker with streaks, analytics, and insights"""
    import json
    import os
    
    # File path for persistent storage
    HABITS_FILE = "data/habits.json"
    
    # Ensure data directory exists
    os.makedirs("data", exist_ok=True)
    
    # Load habits from file if not already loaded
    if not hasattr(habit_log_tool, "habits"):
        try:
            if os.path.exists(HABITS_FILE):
                with open(HABITS_FILE, 'r') as f:
                    data = json.load(f)
                    # Convert sets back from lists
                    for habit_name, habit_data in data.items():
                        if 'dates' in habit_data and isinstance(habit_data['dates'], list):
                            habit_data['dates'] = set(habit_data['dates'])
                    habit_log_tool.habits = data
            else:
                habit_log_tool.habits = {}
        except Exception as e:
            print(f"Error loading habits: {e}")
            habit_log_tool.habits = {}
    
    def save_habits():
        """Save habits to JSON file"""
        try:
            # Convert sets to lists for JSON serialization
            data_to_save = {}
            for habit_name, habit_data in habit_log_tool.habits.items():
                data_copy = habit_data.copy()
                if 'dates' in data_copy and isinstance(data_copy['dates'], set):
                    data_copy['dates'] = list(data_copy['dates'])
                data_to_save[habit_name] = data_copy
            
            with open(HABITS_FILE, 'w') as f:
                json.dump(data_to_save, f, indent=2)
        except Exception as e:
            print(f"Error saving habits: {e}")
    
    
    lower = command.lower().strip()
    today = date.today().isoformat()
    
    # Log a habit
    if any(phrase in lower for phrase in ["log habit", "habit:", "track", "did"]):
        # Extract habit name
        habit_patterns = [
            r"log habit:?\s*(.+)",
            r"habit:?\s*(.+)",
            r"track:?\s*(.+)",
            r"did:?\s*(.+)",
            r"completed?:?\s*(.+)"
        ]
        
        habit = None
        for pattern in habit_patterns:
            match = re.search(pattern, command, re.IGNORECASE)
            if match:
                habit = match.group(1).strip().lower()
                break
        
        if not habit:
            habit = command.strip().lower()
        
        # Initialize habit if new
        if habit not in habit_log_tool.habits:
            habit_log_tool.habits[habit] = {
                "dates": set(), 
                "streak": 0, 
                "last_date": None,
                "best_streak": 0,
                "total_days": 0
            }
            save_habits()  # Save new habit
        
        h = habit_log_tool.habits[habit]
        
        # Check if already logged today
        if h["last_date"] == today:
            return f" Habit '{habit}' already logged today!\n🔥 Current streak: {h['streak']} days\n🏆 Best streak: {h['best_streak']} days"
        
        # Update streak logic
        if h["last_date"]:
            last_date = date.fromisoformat(h["last_date"])
            days_diff = (date.fromisoformat(today) - last_date).days
            
            if days_diff == 1:
                # Consecutive day
                h["streak"] += 1
            else:
                # Streak broken
                h["streak"] = 1
        else:
            # First time logging
            h["streak"] = 1
        
        # Update records
        h["dates"].add(today)
        h["last_date"] = today
        h["total_days"] = len(h["dates"])
        
        # Update best streak
        if h["streak"] > h["best_streak"]:
            h["best_streak"] = h["streak"]
            streak_msg = f"🎉 NEW RECORD! "
        else:
            streak_msg = ""
        
        # Calculate completion rate (last 30 days)
        thirty_days_ago = date.today() - timedelta(days=30)
        recent_completions = sum(1 for date_str in h["dates"] 
                               if date.fromisoformat(date_str) >= thirty_days_ago)
        completion_rate = (recent_completions / 30) * 100
        
        # Save habits to file
        save_habits()
        
        return f"""✅ {streak_msg}Habit '{habit}' logged for today!
🔥 Current streak: {h['streak']} days
🏆 Best streak: {h['best_streak']} days
📊 Total completed: {h['total_days']} days
📈 30-day rate: {completion_rate:.1f}%"""
    
    # Show habit stats
    elif "stats" in lower or "analytics" in lower or "progress" in lower:
        if not habit_log_tool.habits:
            return "📊 No habits tracked yet. Start with 'Log habit: exercise'"
        
        stats = []
        for habit_name, data in habit_log_tool.habits.items():
            # Calculate 7-day and 30-day completion rates
            seven_days_ago = date.today() - timedelta(days=7)
            thirty_days_ago = date.today() - timedelta(days=30)
            
            week_completions = sum(1 for date_str in data["dates"] 
                                 if date.fromisoformat(date_str) >= seven_days_ago)
            month_completions = sum(1 for date_str in data["dates"] 
                                  if date.fromisoformat(date_str) >= thirty_days_ago)
            
            week_rate = (week_completions / 7) * 100
            month_rate = (month_completions / 30) * 100
            
            stats.append(f"""📈 {habit_name.title()}:
   🔥 Current: {data['streak']} days
   🏆 Best: {data['best_streak']} days
   📅 7-day: {week_rate:.0f}% ({week_completions}/7)
   📊 30-day: {month_rate:.0f}% ({month_completions}/30)""")
        
        return "📊 Habit Analytics:\n\n" + "\n\n".join(stats)
    
    # List all habits
    elif "list" in lower and "habit" in lower:
        if not habit_log_tool.habits:
            return "📋 No habits tracked yet. Start with 'Log habit: [habit name]'"
        
        habit_list = []
        for habit_name, data in habit_log_tool.habits.items():
            status = "✅ Done today" if data["last_date"] == today else "⏸️ Pending"
            habit_list.append(f"• {habit_name.title()} - {status} (Streak: {data['streak']})")
        
        return f"📋 Your Habits ({len(habit_list)}):\n" + "\n".join(habit_list)
    
    # Reset a habit
    elif "reset" in lower and "habit" in lower:
        habit_match = re.search(r"reset habit:?\s*(.+)", command, re.IGNORECASE)
        if habit_match:
            habit_name = habit_match.group(1).strip().lower()
            if habit_name in habit_log_tool.habits:
                del habit_log_tool.habits[habit_name]
                save_habits()  # Save after deletion
                return f"🗑️ Reset habit: {habit_name.title()}"
            else:
                return f"❌ Habit '{habit_name}' not found"
        else:
            return "Specify habit to reset: 'Reset habit: exercise'"
    
    # Default fallback
    else:
        return f"""🎯 Habit Commands:
• 'Log habit: exercise' - Record completion
• 'List habits' - Show all habits
• 'Habit stats' - View analytics
• 'Reset habit: [name]' - Remove habit

Try: 'Log habit: {command.strip()}' to track it!"""

habit_log = Tool(
    name="habit_log",
    description="Advanced habit tracker with streaks and analytics (e.g., 'Log habit: exercise', 'List habits', 'Habit stats', 'Reset habit: meditation').",
    func=habit_log_tool
)

# --- Tool: Enhanced Quick Productivity Tasks ---
def quick_task_tool(command: str) -> str:
    """Enhanced productivity tasks with timers, task management, and focus sessions"""
    lower = command.lower().strip()
    
    # Timer functionality
    if "timer" in lower or "start a" in lower:
        # Extract duration
        import re
        duration_patterns = [
            r"(\d+)\s*(?:minute|min)s?",
            r"(\d+)\s*(?:hour|hr)s?",
            r"(\d+)\s*(?:second|sec)s?"
        ]
        
        duration_seconds = None
        duration_text = None
        
        for pattern in duration_patterns:
            match = re.search(pattern, lower)
            if match:
                num = int(match.group(1))
                if "minute" in pattern or "min" in pattern:
                    duration_seconds = num * 60
                    duration_text = f"{num} minute{'s' if num > 1 else ''}"
                elif "hour" in pattern or "hr" in pattern:
                    duration_seconds = num * 3600
                    duration_text = f"{num} hour{'s' if num > 1 else ''}"
                elif "second" in pattern or "sec" in pattern:
                    duration_seconds = num
                    duration_text = f"{num} second{'s' if num > 1 else ''}"
                break
        
        # Default timer
        if not duration_seconds:
            if "pomodoro" in lower:
                duration_seconds = 25 * 60  # 25 minutes
                duration_text = "25 minutes (Pomodoro)"
            else:
                duration_seconds = 5 * 60  # Default 5 minutes
                duration_text = "5 minutes"
        
        # Start timer in background
        def timer_task():
            import time
            time.sleep(duration_seconds)
            try:
                import plyer
                plyer.notification.notify(
                    title="⏰ Timer Complete!",
                    message=f"{duration_text} timer finished",
                    timeout=10
                )
            except ImportError:
                print(f"🔔 TIMER COMPLETE: {duration_text} timer finished!")
        
        import threading
        timer_thread = threading.Thread(target=timer_task, daemon=True)
        timer_thread.start()
        
        return f"⏰ Started {duration_text} timer. You'll get a notification when it's done!"
    
    # Task list management
    elif "list" in lower and "task" in lower:
        if not hasattr(quick_task_tool, "tasks"):
            quick_task_tool.tasks = []
        
        if quick_task_tool.tasks:
            task_list = "\n".join([f"{i+1}. {task}" for i, task in enumerate(quick_task_tool.tasks)])
            return f"📋 Your tasks:\n{task_list}"
        else:
            return "📋 No tasks in your list. Add some with 'add task: [description]'"
    
    # Add task
    elif "add task" in lower or "new task" in lower:
        if not hasattr(quick_task_tool, "tasks"):
            quick_task_tool.tasks = []
        
        # Extract task description
        task_match = re.search(r"(?:add task|new task):?\s*(.+)", command, re.IGNORECASE)
        if task_match:
            task_desc = task_match.group(1).strip()
            quick_task_tool.tasks.append(task_desc)
            return f"✅ Added task: {task_desc} (Total: {len(quick_task_tool.tasks)})"
        else:
            return "Please specify the task. Example: 'Add task: Review project proposal'"
    
    # Complete task
    elif "complete task" in lower or "done task" in lower or "finish task" in lower:
        if not hasattr(quick_task_tool, "tasks") or not quick_task_tool.tasks:
            return "📋 No tasks to complete!"
        
        # Try to extract task number
        num_match = re.search(r"(?:task\s*)?(\d+)", lower)
        if num_match:
            task_num = int(num_match.group(1)) - 1
            if 0 <= task_num < len(quick_task_tool.tasks):
                completed_task = quick_task_tool.tasks.pop(task_num)
                return f"✅ Completed: {completed_task}\nRemaining tasks: {len(quick_task_tool.tasks)}"
            else:
                return f"❌ Task number {task_num + 1} not found. You have {len(quick_task_tool.tasks)} tasks."
        else:
            # Complete the first task
            completed_task = quick_task_tool.tasks.pop(0)
            return f"✅ Completed: {completed_task}\nRemaining tasks: {len(quick_task_tool.tasks)}"
    
    # Focus session
    elif "focus" in lower or "deep work" in lower:
        # Start a focus session with break reminders
        duration = 50  # Default 50 minutes
        
        def focus_session():
            import time
            time.sleep(duration * 60)
            try:
                import plyer
                plyer.notification.notify(
                    title="🎯 Focus Session Complete!",
                    message="Great work! Time for a 10-minute break.",
                    timeout=10
                )
            except ImportError:
                print("🎯 FOCUS SESSION COMPLETE! Time for a break.")
        
        import threading
        focus_thread = threading.Thread(target=focus_session, daemon=True)
        focus_thread.start()
        
        return f"🎯 Started {duration}-minute deep work session. Stay focused! Break notification coming up."
    
    # Clear all tasks
    elif "clear tasks" in lower or "reset tasks" in lower:
        if hasattr(quick_task_tool, "tasks"):
            count = len(quick_task_tool.tasks)
            quick_task_tool.tasks = []
            return f"🗑️ Cleared {count} tasks from your list"
        else:
            return "📋 Task list is already empty"
    
    # Default: generic task execution
    else:
        return f"⚡ Task noted: {command}\n\nAvailable commands:\n• 'Start 25 minute timer'\n• 'Add task: [description]'\n• 'List tasks'\n• 'Complete task 1'\n• 'Start focus session'"

quick_task = Tool(
    name="quick_task",
    description="Enhanced productivity: timers, task management, focus sessions (e.g., 'Start 25 minute timer', 'Add task: Review email', 'List tasks', 'Start focus session').",
    func=quick_task_tool
)

# --- Command-based tool routing ---
async def get_response(command):
    lower = command.lower().strip()
    command_type = None
    response = None
    
    # Browser/web commands - prioritize these
    # Enhanced detection for voice commands that start with "chrome" or contain search terms
    if (any(phrase in lower for phrase in ["open chrome", "open browser", "chrome and search", "chrome search", "youtube", "google search", "search google", "search on google", "open website", "open url", "best youtube channel", "tell me the best youtube channel"]) or
        # Check if command starts with "chrome" (for voice commands like "chrome and search for...")
        (lower.startswith("chrome") and ("search" in lower or "for" in lower)) or
        # Check for "google" + "search" patterns
        ("google" in lower and "search" in lower)):
        command_type = "browser"
        response = browser.func(command)
    elif lower.startswith("remind me") or lower.startswith("set a reminder") or "reminder" in lower:
        command_type = "reminder"
        result = reminder.func(command)
        # Convert dict result to string if needed
        if isinstance(result, dict):
            response = result.get("message", str(result))
        else:
            response = result
    elif lower.startswith("break down") or "break down" in lower or "goal" in lower:
        command_type = "goals"
        response = goal_breakdown.func(command)
    elif lower.startswith("log habit") or lower.startswith("habit:") or "habit" in lower or "track" in lower:
        command_type = "habits"
        response = habit_log.func(command)
    elif lower.startswith("start a") or lower.startswith("list my tasks") or lower.startswith("quick task") or "timer" in lower or "task" in lower or "focus" in lower or "add task" in lower or "complete task" in lower:
        command_type = "tasks"
        response = quick_task.func(command)
    elif lower == "get reminders" or lower == "show reminders" or lower == "list reminders":
        command_type = "reminder"
        reminders = getattr(enhanced_reminder_tool, "reminders", [])
        if reminders:
            active_reminders = [r for r in reminders if not r.get("triggered", False)]
            if active_reminders:
                reminder_list = "\n".join([f"- {r['content']}" + (f" ({r['time']})" if r['time'] else "") for r in active_reminders])
                response = f"Active reminders:\n{reminder_list}"
            else:
                response = "No active reminders."
        else:
            response = "No reminders set."
    elif "habit" in lower or "log habit" in lower or "track" in lower or "habit stats" in lower or "list habits" in lower:
        command_type = "habits"
        response = habit_log.func(command)
    else:
        # Use Sarvam LLM for complex queries
        command_type = "chat"
        try:
            # Use Sarvam LLM to handle general queries
            result_queue = queue.Queue()
            
            def run_sarvam_chat():
                try:
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
                    
                    async def call_sarvam():
                        messages = [
                            {"role": "system", "content": "You are Ruhaan, a helpful AI assistant. Provide concise, helpful responses. If the user asks about specific tools or features, guide them to use the appropriate commands like 'remind me to...', 'note: ...', 'break down: ...', 'log habit: ...', or 'open chrome'."},
                            {"role": "user", "content": command}
                        ]
                        
                        response = await sarvam_client.chat(
                            messages=messages,
                            model="sarvam-m",
                            temperature=0.7,
                            max_tokens=500
                        )
                        
                        return response['choices'][0]['message']['content']
                    
                    result = loop.run_until_complete(call_sarvam())
                    result_queue.put(("success", result))
                    loop.close()
                except Exception as e:
                    result_queue.put(("error", str(e)))
            
            thread = threading.Thread(target=run_sarvam_chat)
            thread.start()
            thread.join(timeout=15)
            
            if not result_queue.empty():
                status, result = result_queue.get()
                if status == "success":
                    response = result
                else:
                    raise Exception(f"Sarvam error: {result}")
            else:
                raise Exception("Sarvam call timed out")
                
        except Exception as e:
            print(f"Sarvam LLM Error: {e}")
            response = f"I couldn't understand the command: {command}. Try commands like 'remind me to...', 'note: ...', 'break down: ...', 'log habit: ...', or 'open chrome'."
    

# --- FastAPI endpoints ---

@router.post("/execute")
async def execute_command(request: CommandRequest):
    try:
        command = getattr(request, 'command', None)
        if not command:
            raise ValueError("'command' is required.")
        
        print(f"🔍 Processing command: {command}")
        
        command_type = "unknown"
        lower_command = command.lower().strip()
        
        if "remind" in lower_command:
            command_type = "reminder"
        elif "note:" in lower_command:
            command_type = "note"
        elif "break down:" in lower_command:
            command_type = "goal_breakdown"
        elif "log habit:" in lower_command:
            command_type = "habit_log"
        elif "open" in lower_command:
            command_type = "browser"
        elif "task:" in lower_command:
            command_type = "quick_task"
        
        response = await get_response(command)
        print(f"📤 Response length: {len(str(response))} chars")
        print(f"📤 Response preview: {str(response)[:200]}...")
        
        # Ensure response is JSON serializable
        if isinstance(response, dict):
            return {"response": response}
        else:
            return {"response": str(response)}
    except Exception as e:
        print(f"❌ Error in execute_command: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- Create list of all tools for API ---
all_tools = [browser, reminder, goal_breakdown, habit_log, quick_task]

@router.get("/tools")
async def list_tools():
    return {
        "tools": [
            {"name": tool.name, "description": tool.description} for tool in all_tools
        ]
    }

@router.get("/reminders")
async def get_reminders():
    reminders = getattr(enhanced_reminder_tool, "reminders", [])
    return {"reminders": reminders}


ask_manus_agent = get_response

def _extract_youtube_query_semantic(command: str) -> str:
    """
    Extract the actual search query from YouTube commands without unnecessary conversions.
    """
    lower_command = command.lower().strip()
    print(f"🔍 Processing YouTube query: '{command}'")
    
    # Direct extraction patterns for common YouTube search commands
    search_patterns = [
        r"(?:youtube|open youtube)(?:\s+and)?\s+search\s+for\s+(.+)",
        r"search\s+youtube\s+for\s+(.+)",
        r"search\s+for\s+(.+?)(?:\s+on\s+youtube|$)",
        r"find\s+(.+?)(?:\s+on\s+youtube|$)",
        r"show\s+me\s+(.+?)(?:\s+on\s+youtube|$)",
        r"youtube\s+(.+)",
    ]
    
    # Try to extract the actual search query
    for pattern in search_patterns:
        match = re.search(pattern, lower_command)
        if match:
            query = match.group(1).strip()
            print(f"🎯 Extracted query: '{query}'")
            return query
    
    # If no pattern matched, remove common noise words and return the rest
    noise_words = {
        'search', 'find', 'open', 'show', 'watch', 'play', 'tell', 'gives', 'get',
        'youtube', 'video', 'videos', 'channel', 'channels', 'content',
        'me', 'please', 'want', 'to', 'a', 'an', 'the', 'is', 'are',
        'and', 'or', 'but', 'for', 'on', 'in', 'with', 'of', 'about'
    }
    
    words = command.split()
    filtered_words = []
    
    for word in words:
        clean_word = re.sub(r'[^\w]', '', word.lower())
        if clean_word not in noise_words and len(clean_word) > 1:
            filtered_words.append(word)
    
    if filtered_words:
        result = ' '.join(filtered_words).strip()
        print(f"🎯 Filtered query: '{result}'")
        return result
    
    # Fallback
    print("🎯 Using fallback query")
    return "trending videos"

def _convert_to_search_keywords(topics: str) -> str:
    """
    Convert verbose topics into focused, searchable keywords.
    """
    lower_topics = topics.lower().strip()
    
    # Predefined topic mappings for better search results
    topic_maps = {
        # Business & Startup
        r"startup.*content.*creation|content.*creation.*startup": "startup content creator",
        r"entrepreneurship.*content|content.*entrepreneurship": "entrepreneur creator",
        r"business.*content.*creation|content.*creation.*business": "business content creator",
        r"startup.*entrepreneur": "startup entrepreneur",
        
        # Content Creation
        r"content.*creation.*together|together.*content.*creation": "content creation tips",
        r"creator.*economy|economy.*creator": "creator economy",
        r"digital.*marketing.*content|content.*digital.*marketing": "content marketing",
        
        # Tech & Programming
        r"programming.*tutorial|tutorial.*programming": "programming tutorial",
        r"coding.*beginner|beginner.*coding": "coding for beginners",
        r"web.*development|development.*web": "web development",
        
        # Finance & Investing
        r"stock.*market|market.*stock": "stock market",
        r"investment.*advice|advice.*investment": "investment tips",
        r"crypto.*trading|trading.*crypto": "crypto trading",
        
        # Productivity & Skills
        r"productivity.*tips|tips.*productivity": "productivity hacks",
        r"time.*management|management.*time": "time management",
        r"skill.*development|development.*skill": "skill building",
        
        # Generic improvements
        r"tell.*about|tells.*about|explain.*about": "",
        r"combination.*of|mix.*of|blend.*of": "",
        r"together\.|together$": "",
        r"which.*tells|that.*tells": "",
    }
    
    # Apply topic mappings
    final_keywords = lower_topics
    for pattern, replacement in topic_maps.items():
        if re.search(pattern, final_keywords):
            if replacement:  # If replacement is not empty
                final_keywords = replacement
                break
            else:  # If replacement is empty, remove the pattern
                final_keywords = re.sub(pattern, "", final_keywords).strip()
    
    # Clean up and optimize keywords
    # Remove excessive words, keep 2-4 key terms max
    words = final_keywords.split()
    if len(words) > 4:
        # Keep most important words 
        important_words = []
        for word in words:
            if len(word) > 3 and word not in ['which', 'that', 'about', 'together']:
                important_words.append(word)
                if len(important_words) >= 3:  # Limit to 3 key terms
                    break
        final_keywords = ' '.join(important_words)
    
    # Final cleanup
    final_keywords = re.sub(r'\s+', ' ', final_keywords).strip()
    
    if not final_keywords or len(final_keywords) < 5:
        return "content creator tips"
    
    return final_keywords

def _extract_google_query_semantic(command: str) -> str:
    """
    Intelligently extract Google search query using semantic analysis.
    """
    # Convert to lowercase for processing
    lower_command = command.lower().strip()
    
    # Handle specific patterns first
    google_and_search_patterns = [
        r'open google and search for (.+)',
        r'google and search for (.+)',
        r'open google and search (.+)',
        r'google and search (.+)',
        r'search google for (.+)',
        r'search on google for (.+)',
        r'google search for (.+)',
        r'google (.+)'
    ]
    
    for pattern in google_and_search_patterns:
        match = re.search(pattern, lower_command)
        if match:
            query = match.group(1).strip()
            # Clean up common trailing words
            query = re.sub(r'\s+(please|now|today)$', '', query)
            if query:
                print(f"📝 Google pattern extraction: '{command}' → '{query}'")
                return query
    
    # Define command/function words to filter out for Google searches
    command_words = {
        'search', 'google', 'find', 'open', 'show', 'look', 'on', 'for', 'about', 
        'up', 'in', 'and', 'the', 'a', 'an', 'which', 'that', 'information',
        'please', 'can', 'you', 'me', 'i', 'want', 'to', 'go', 'visit', 'check',
        'chrome', 'browser'  # Add chrome and browser as command words to filter
    }
    
    # Split into words and filter
    words = command.split()
    content_words = []
    
    for word in words:
        # Remove punctuation from word for checking
        clean_word = re.sub(r'[^\w]', '', word.lower())
        
        # Keep the word if it's not a command word and has meaningful content
        if clean_word not in command_words and len(clean_word) > 1:
            content_words.append(word)
        elif len(clean_word) == 1 and clean_word.isalpha():
            content_words.append(word)
    
    # Join remaining words as the search query
    query = ' '.join(content_words).strip()
    
    print(f"📝 Google semantic extraction: '{command}' → '{query}'")
    
    # Fallback: if no content words found, try basic extraction
    if not query:
        for phrase in ['google', 'search', 'find', 'open', 'show']:
            if phrase in lower_command:
                parts = lower_command.split(phrase, 1)
                if len(parts) > 1:
                    query = parts[1].strip()
                    query = re.sub(r'^(for |about |on |in )', '', query).strip()
                    break
        print(f"🔄 Google fallback extraction: '{query}'")
    
    return query