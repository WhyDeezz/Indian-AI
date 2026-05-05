import asyncio
import json
import os
import queue
import re
import threading
from datetime import date, timedelta

from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from src.Backend.sarvam import Sarvam

load_dotenv()

router = APIRouter()
sarvam_client = Sarvam(api_key=os.getenv("SARVAM_API_KEY"))


class Tool:
    def __init__(self, name: str, description: str, func):
        self.name = name
        self.description = description
        self.func = func


class CommandRequest(BaseModel):
    command: str


def enhanced_goal_breakdown_tool(command: str) -> str:
    goal = command.strip()
    goal = re.sub(r"(?i)^break down:?", "", goal).strip()
    goal = re.sub(r"(?i)^goal:?", "", goal).strip()

    if not goal:
        return "Please provide a goal to break down. Example: 'Break down: Learn Python'"

    breakdown_prompt = f"""Break down this goal into exactly 3 actionable steps: \"{goal}\".

Use a simple format with:
Step 1: [title]
- action
- milestone
- deliverable
- validation

Step 2: [title]
- action
- milestone
- deliverable
- validation

Step 3: [title]
- action
- milestone
- deliverable
- validation

Goal: {goal}"""

    result_queue = queue.Queue()

    def run_sarvam_llm():
        try:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

            async def call_sarvam():
                messages = [
                    {"role": "system", "content": "You are an expert advisor who breaks goals into practical steps."},
                    {"role": "user", "content": breakdown_prompt},
                ]
                response = await sarvam_client.chat(
                    messages=messages,
                    model="sarvam-m",
                    temperature=0.3,
                    max_tokens=1200,
                )
                return response["choices"][0]["message"]["content"]

            result = loop.run_until_complete(call_sarvam())
            result_queue.put(("success", result))
            loop.close()
        except Exception as exc:
            result_queue.put(("error", str(exc)))

    thread = threading.Thread(target=run_sarvam_llm)
    thread.start()
    thread.join(timeout=30)

    if result_queue.empty():
        raise Exception("Sarvam call timed out")

    status, result = result_queue.get()
    if status != "success":
        raise Exception(result)

    return result


goal_breakdown = Tool(
    name="goal_breakdown",
    description="Break down a goal into three practical steps.",
    func=enhanced_goal_breakdown_tool,
)


def habit_log_tool(command: str) -> str:
    HABITS_FILE = "data/habits.json"
    os.makedirs("data", exist_ok=True)

    if not hasattr(habit_log_tool, "habits"): 
        try:
            if os.path.exists(HABITS_FILE):
                with open(HABITS_FILE, "r", encoding="utf-8") as file:
                    data = json.load(file)
                    for habit_name, habit_data in data.items():
                        if isinstance(habit_data.get("dates"), list):
                            habit_data["dates"] = set(habit_data["dates"])
                    habit_log_tool.habits = data
            else:
                habit_log_tool.habits = {}
        except Exception:
            habit_log_tool.habits = {}

    def save_habits():
        data_to_save = {}
        for habit_name, habit_data in habit_log_tool.habits.items():
            copy_data = habit_data.copy()
            if isinstance(copy_data.get("dates"), set):
                copy_data["dates"] = list(copy_data["dates"])
            data_to_save[habit_name] = copy_data

        with open(HABITS_FILE, "w", encoding="utf-8") as file:
            json.dump(data_to_save, file, indent=2)

    lower = command.lower().strip()
    today = date.today().isoformat()

    if any(phrase in lower for phrase in ["log habit", "habit:", "track", "did"]):
        habit = None
        for pattern in [r"log habit:?\s*(.+)", r"habit:?\s*(.+)", r"track:?\s*(.+)", r"did:?\s*(.+)", r"completed?:?\s*(.+)"]:
            match = re.search(pattern, command, re.IGNORECASE)
            if match:
                habit = match.group(1).strip().lower()
                break

        if not habit:
            habit = command.strip().lower()

        if habit not in habit_log_tool.habits:
            habit_log_tool.habits[habit] = {"dates": set(), "streak": 0, "last_date": None, "best_streak": 0, "total_days": 0}

        habit_data = habit_log_tool.habits[habit]
        if today not in habit_data["dates"]:
            habit_data["dates"].add(today)
            habit_data["total_days"] += 1
            if habit_data["last_date"]:
                try:
                    last_date = date.fromisoformat(habit_data["last_date"])
                    yesterday = date.fromisoformat(today) - timedelta(days=1)
                    habit_data["streak"] = habit_data["streak"] + 1 if last_date == yesterday else 1
                except Exception:
                    habit_data["streak"] = 1
            else:
                habit_data["streak"] = 1
            habit_data["last_date"] = today
            habit_data["best_streak"] = max(habit_data["best_streak"], habit_data["streak"])
            save_habits()
            return f"✅ Logged habit: {habit}\n🔥 Current streak: {habit_data['streak']} days"
        return f"ℹ️ Habit '{habit}' already logged today"

    if any(phrase in lower for phrase in ["list habits", "show habits", "habits"]):
        if not habit_log_tool.habits:
            return "📋 No habits logged yet"
        return "\n".join([
            f"{i+1}. {habit} - streak: {data['streak']}, best: {data['best_streak']}, total: {data['total_days']}"
            for i, (habit, data) in enumerate(habit_log_tool.habits.items())
        ])

    if "habit stats" in lower:
        if not habit_log_tool.habits:
            return "📊 No habit stats available yet"
        return "\n".join([
            f"{habit}: streak {data['streak']}, best {data['best_streak']}, total {data['total_days']}"
            for habit, data in habit_log_tool.habits.items()
        ])

    if "reset habit" in lower:
        match = re.search(r"reset habit:?\s*(.+)", command, re.IGNORECASE)
        if match:
            habit_name = match.group(1).strip().lower()
            if habit_name in habit_log_tool.habits:
                del habit_log_tool.habits[habit_name]
                save_habits()
                return f"🗑️ Reset habit: {habit_name}"
            return f"❌ Habit '{habit_name}' not found"
        return "Specify habit to reset: 'Reset habit: exercise'"

    return "Try: 'Log habit: exercise', 'List habits', or 'Habit stats'"


habit_log = Tool(
    name="habit_log",
    description="Track habits, streaks, and habit stats.",
    func=habit_log_tool,
)


def get_response(command: str):
    lower = command.lower().strip()

    if lower.startswith("break down") or "goal" in lower:
        return goal_breakdown.func(command)

    if any(keyword in lower for keyword in ["log habit", "habit:", "track", "did", "habit stats", "list habits", "reset habit", "show habits"]):
        return habit_log.func(command)

    return "Only goal breakdown and habit logging are available now."


@router.post("/execute")
async def execute_command(request: CommandRequest):
    try:
        command = getattr(request, "command", None)
        if not command:
            raise ValueError("'command' is required.")

        response = get_response(command)
        if isinstance(response, dict):
            return {"response": response}
        return {"response": str(response)}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


all_tools = [goal_breakdown, habit_log]


@router.get("/tools")
async def list_tools():
    return {"tools": [{"name": tool.name, "description": tool.description} for tool in all_tools]}


ask_tasks_agent = get_response