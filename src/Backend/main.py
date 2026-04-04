import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv 
import uvicorn 
from fastapi.staticfiles import StaticFiles

load_dotenv()
#venv312\Scripts\activate
#uvicorn src.Backend.main:app --reload 
# Import routers
from src.Backend.routes.api_frontend import router as api_frontend_router
from src.Backend.routes.speech import router as speech_router
from src.Backend.routes.manusagent import router as manus_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Local development
        "https://*.vercel.app",   # Vercel deployments
        "https://ruhaan-ai-agent.vercel.app",  # Your specific frontend URL
        "https://www.indian-ai.com/"
    ],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]  
)

app.mount(
    "/static",
    StaticFiles(directory=os.path.join(os.path.dirname(__file__), "../../public")),
    name="static"
)

# Route registrations
app.include_router(api_frontend_router, prefix="/api", tags=["Frontend API"])
app.include_router(speech_router, prefix="/api/speech", tags=["Speech"])
app.include_router(manus_router, prefix="/api/command", tags=["Commands"])


@app.get("/")
async def root():
    return {"message": "AI backend is running!"}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

