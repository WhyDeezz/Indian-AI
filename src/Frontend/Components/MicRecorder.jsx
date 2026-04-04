import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { playTTS } from "./playTTS";

const API_BASE_URL = "https://www.indian-ai.com";

const MicRecorder = ({ setMessages, isRecording, setIsRecording }) => {
  const [transcription, setTranscription] = useState("");
  const mediaRecorderRef = useRef(null);
  const audioChunks = useRef([]);

  // Handle recording state changes from parent
  useEffect(() => {
    if (isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new window.MediaRecorder(stream);
      audioChunks.current = [];
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };
      mediaRecorderRef.current.onstop = async () => {
        try {
          // Use the actual format produced by MediaRecorder (webm)
          const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
          const formData = new FormData();
          formData.append('file', audioBlob, 'audio.webm');

          // Send to WhisperAPI for transcription
          const response = await axios.post(
            `${API_BASE_URL}/api/speech/transcribe/`,
            formData,
            {
              headers: { "Content-Type": "multipart/form-data" },
            }
          );

          if (response.data.status === "success") {
            console.log("🔍 Full speech response:", response.data);
            const data = response.data.data;
            console.log("🔍 Extracted data:", data);
            const { transcription, response_text, language_code, type } = data;
            
            // Clean transcription for display - remove non-English scripts
            function cleanTranscriptionForDisplay(text, langCode) {
              // Check if text contains non-ASCII characters (blocked languages)
              const hasNonAscii = /[^\x00-\x7F]/.test(text);
              const isHindi = /[\u0900-\u097F]/.test(text); // Devanagari script
              
              // If it's Hindi (Devanagari), keep it
              if (isHindi && langCode === 'hi-IN') {
                return text;
              }
              
              // If it has non-ASCII but forced to English, show fallback
              if (hasNonAscii && langCode === 'en-IN') {
                console.log('🔧 Frontend: Cleaning blocked script from display');
                return "Hello, can you speak in English?"; // Clean English fallback
              }
              
              return text; // Keep original if it's clean
            }
            
            const displayTranscription = cleanTranscriptionForDisplay(transcription, language_code);
            setTranscription(displayTranscription);
            
            // Handle different response types
            if (type === "structured") {
              // For structured responses, use the response field and voice_message
              const structuredResponse = data.response;
              const voiceMessage = data.voice_message;
              
              setMessages((prev) => [
                ...prev,
                { text: displayTranscription, sender: "user" },
                { text: structuredResponse, sender: "bot", structured: true }
              ]);
              
              // Use voice_message for TTS
              if (voiceMessage && typeof voiceMessage === "string") {
                console.log("🎤 MicRecorder: Using structured voice_message for TTS");
                console.log("📏 Voice message length:", voiceMessage.length, "characters");
                console.log("📝 Voice message word count:", voiceMessage.split(' ').length, "words");
                console.log("🔤 First 100 chars:", voiceMessage.substring(0, 100) + "...");
                console.log("🔚 Last 100 chars:", "..." + voiceMessage.substring(voiceMessage.length - 100));
                
                // Check if it's over TTS limit
                if (voiceMessage.length > 2500) {
                  console.warn("⚠️ Voice message exceeds 2500 char TTS limit!");
                  const truncated = voiceMessage.substring(0, 2500) + "...";
                  console.log("✂️ Truncating to:", truncated.length, "characters");
                  await playTTS(truncated, language_code);
                } else {
                  await playTTS(voiceMessage, language_code);
                }
              } else {
                console.log("⚠️ MicRecorder: No voice_message in structured response");
                console.log("🔍 voiceMessage type:", typeof voiceMessage);
                console.log("🔍 voiceMessage value:", voiceMessage);
                await playTTS("Here are your next actionable steps.", language_code);
              }
            } else {
              // For chit-chat and commands, use response_text
              setMessages((prev) => [
                ...prev,
                { text: displayTranscription, sender: "user" },
                { text: response_text, sender: "bot" }
              ]);
              
              // Use response_text for TTS
              if (response_text && typeof response_text === "string") {
                console.log("🎤 MicRecorder: Using response_text for TTS:", response_text.substring(0, 50) + "...");
                await playTTS(response_text, language_code);
              } else {
                console.log("⚠️ MicRecorder: No response_text available");
              }
            }
          } else {
            console.error("Error: Speech API returned failure status");
            setTranscription("Error processing audio");
          }
        } catch (error) {
          console.error("Error:", error);
          setTranscription("Error processing audio");
         
        }
      };

      audioChunks.current = [];
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  return null; // No UI needed, controlled from parent
};

export default MicRecorder;
