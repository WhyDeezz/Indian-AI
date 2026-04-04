import axios from "axios";

const API_BASE_URL = "https://www.indian-ai.com";

//Speech-to-Text 
export const transcribeAudio = async (audioFile) => {
  const formData = new FormData();
  formData.append("file", audioFile);

  try {
    const response = await axios.post(`${API_BASE_URL}/api/speech/transcribe/`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    if (response.data.status === "success") {
      return response.data.data;
    }
    throw new Error("Transcription failed");
  } catch (error) {
    console.error("Error in transcription:", error);
    throw error;
  }
};

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

//  Convert Text to Speech 
export const textToSpeech = async (text) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/speech/text-to-speech/`, 
      { text },
      { 
        responseType: 'blob',
        headers: { 
          "Content-Type": "application/json",
          "Accept": "audio/mpeg"
        }
      }
    );
    
    if (response.data instanceof Blob) {
      return response.data;
    }
    throw new Error("Invalid response format");
  } catch (error) {
    console.error("Error in text-to-speech:", error);
    throw error;
  }
};
