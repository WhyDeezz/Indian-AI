import axios from "axios";

const API_BASE_URL = "https://www.indian-ai.com";

export async function playTTS(text, language_code) {
  try {
    // STRICT FILTERING: Only allow English and Hindi language codes
    const allowedLanguages = ['en-IN', 'hi-IN'];
    const safeLanguageCode = allowedLanguages.includes(language_code) ? language_code : 'en-IN';
    
    if (language_code && !allowedLanguages.includes(language_code)) {
      console.log(`Frontend TTS: Blocking unsupported language ${language_code}, using en-IN instead`);
    }
    
    const ttsResponse = await axios.post(
      `${API_BASE_URL}/api/speech/text-to-speech/`,
      safeLanguageCode ? { text, target_language_code: safeLanguageCode } : { text },
      {
        responseType: 'blob',
        headers: { "Content-Type": "application/json" }
      }
    );
    const audioBlob = new Blob([ttsResponse.data], { type: 'audio/wav' });
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    audio.play();
  } catch (error) {
    console.error("Error playing audio:", error);
  }
}
