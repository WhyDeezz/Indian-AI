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

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  
        "https://www.indian-ai.com",
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


@app.get("/")
async def root():
    return {"message": "AI backend is running!"}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

