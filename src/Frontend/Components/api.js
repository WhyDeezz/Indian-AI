import axios from "axios";

// const API_BASE_URL = "https://www.indian-ai.com";
const API_BASE_URL = "http://localhost:8000";

// Process Text Query (AI Response from Groq)
export const processTextQuery = async (message, language_code) => {
  try {
    const payload = language_code ? { message, language_code } : { message };
    const response = await axios.post(`${API_BASE_URL}/api/chat`, 
      payload,  
      { headers: { "Content-Type": "application/json" } }
    );
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.detail || error.message;
    throw new Error(`Failed to process message: ${errorMessage}`);
  }
};
