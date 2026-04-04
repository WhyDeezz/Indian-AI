// Environment configuration for API endpoints
// This centralizes all API URLs for easier management

const environment = {
  // Production backend URL
  API_BASE_URL: "https://ruhaan-336f0cf6b1b5.herokuapp.com",
  
  // Development backend URL (for local development)
  // API_BASE_URL: "http://localhost:8000",
  ADMIN_ENDPOINT: "/api/admin",
  
  // Command execution endpoint
  COMMAND_ENDPOINT: "/api/command/execute",
  
  // TTS endpoint
  TTS_ENDPOINT: "/api/tts",
  
  // Speech-to-text endpoint
  STT_ENDPOINT: "/api/stt"
};

export default environment;
