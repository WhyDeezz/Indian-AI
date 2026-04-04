import React, { useState, useRef, useEffect } from "react";
import ChatInput from "./ChatInput";
import { processTextQuery } from "./api";
import { playTTS } from "./playTTS";
import { requestNotificationPermission, scheduleReminderNotification } from "../utils/reminderNotifications";

const Chatbot = ({ messages, setMessages, onLogoClick, isRecording }) => {
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Toast fallback for reminders
  function showToast(message) {
    const toast = document.createElement("div");
    toast.innerText = message;
    toast.style.position = "fixed";
    toast.style.bottom = "30px";
    toast.style.right = "30px";
    toast.style.background = "#333";
    toast.style.color = "#fff";
    toast.style.padding = "12px 24px";
    toast.style.borderRadius = "8px";
    toast.style.zIndex = 9999;
    toast.style.fontSize = "1.1em";
    document.body.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 5000);
  }

  const handleSendMessage = async (messageText, languageCode = null) => {
    const userMessage = { text: messageText, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    

    
    const startTime = Date.now();
  
    try {
      const response = await processTextQuery(messageText, languageCode);
      
      console.log("Backend Response:", response); // Debug log
      
      let data = response.data.data || response.data;
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
          console.log("[DEBUG] Parsed stringified data from backend:", data);
        } catch (e) {
          console.error("[DEBUG] Failed to parse stringified data:", data);
        }
      }
      const botReply = data.response;
      const voiceMessage = data.voice_message;
      const langCode = data.language_code;
      
      console.log("[DEBUG] Full backend response:", response.data);
      console.log("[DEBUG] Extracted data:", data);
      console.log("[DEBUG] data.type:", data.type);
      console.log("[DEBUG] botReply type:", typeof botReply);
      console.log("[DEBUG] botReply content:", botReply);
      console.log("[DEBUG] voice_message:", voiceMessage);
      console.log("[DEBUG] Has required sections?", {
        psychological: botReply?.psychological ? "✓" : "✗",
        philosophical: botReply?.philosophical ? "✓" : "✗", 
        autobiographical: botReply?.autobiographical ? "✓" : "✗",
        logical: botReply?.logical ? "✓" : "✗"
      });
      
      if (typeof botReply === "object" && botReply !== null && botReply.message && typeof botReply.message === "string") {
        setMessages((prevMessages) => [
          ...prevMessages,
          { text: botReply.message, sender: "bot", structured: false },
        ]);
        if (typeof botReply.message === "string") {
          await playTTS(botReply.message, langCode);
        }
        if (botReply.reminder_time && botReply.reminder_text) {
          requestNotificationPermission();
          scheduleReminderNotification({
            ...botReply,
            onToast: () => showToast("Reminder: " + botReply.reminder_text)
          });
          setMessages((prevMessages) => [
            ...prevMessages,
            { text: `Reminder set for ${botReply.reminder_time}. You will be notified.`, sender: "system" },
          ]);
        }
        return;
      }
      // Only show 4-perspective if type is structured (not for chit-chat)
      if (
        typeof data.type === "string" &&
        data.type === "structured" &&
        typeof botReply === "object" &&
        botReply.psychological &&
        botReply.philosophical &&
        botReply.autobiographical &&
        botReply.logical
      ) {
        setMessages((prevMessages) => [
          ...prevMessages,
          { text: botReply, sender: "bot", structured: true },
        ]);
        // Truncate voiceMessage to 2500 chars for TTS API safety
        const safeVoiceMessage = typeof voiceMessage === "string" ? voiceMessage.slice(0, 2500) : "";
        if (safeVoiceMessage && safeVoiceMessage.trim().length > 0) {
          console.log("🎤 Using action-only voice_message for TTS:", safeVoiceMessage.substring(0, 50) + "...");
          await playTTS(safeVoiceMessage, langCode);
        } else {
          console.error("❌ No valid voice_message in backend response! Full response:", response.data);
          // Don't play TTS if there's no valid voice message
        }
        return;
      }
      // Fallback: if botReply.message exists, show it (for chit-chat, etc)
      if (botReply && botReply.message) {
        setMessages((prevMessages) => [
          ...prevMessages,
          { text: botReply.message, sender: "bot", structured: false },
        ]);
        if (typeof botReply.message === "string") {
          await playTTS(botReply.message, langCode);
        }
        return;
      }
      // Fallback: if botReply is a string, show it
      if (typeof botReply === "string") {
        setMessages((prevMessages) => [
          ...prevMessages,
          { text: botReply, sender: "bot", structured: false },
        ]);
        await playTTS(botReply, langCode);
        return;
      }
      
      // Final fallback: if we get here, something unexpected happened
      console.warn("Unexpected response format:", { data, botReply, voiceMessage });
      const fallbackMessage = "I received a response but couldn't format it properly. Please try again.";
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: fallbackMessage, sender: "bot", structured: false },
      ]);
      await playTTS(fallbackMessage, langCode);
      
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        { text: "Sorry, I'm having trouble responding.", sender: "bot" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStructuredMessage = (message) => {
    if (!message.structured) return message.text;
    
    console.log("Rendering structured message:", message.text); // Debug log

    const sections = [
      { key: "psychological", title: "Health", color: "#4a90e2" },
      { key: "philosophical", title: "Family", color: "#50c878" },
      { key: "autobiographical", title: "Dream", color: "#e67e22" },
      { key: "logical", title: "Society", color: "#9b59b6" }
    ];

    return (
      <div className="structured-response">
        {sections.map(section => {
          const content = message.text[section.key];
          console.log(`Rendering section ${section.key}:`, content); // Debug log
          
          if (!content) {
            console.warn(`Missing content for section ${section.key}`);
            return null;
          }

          return (
            <div key={section.key} className="response-box" style={{ borderColor: section.color }}>
              <h3 style={{ color: section.color }}>{section.title}</h3>
              <p>{content.analysis || content.perspective || content.story || content.framework}</p>
              {content.key_points && content.key_points.length > 0 && (
                <ul>
                  {content.key_points.map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="chatbot-interface">
      {messages.length === 0 && (
        <div className="initial-text">
          <div className="hero-logo-trigger" onClick={onLogoClick}>
            <div className="logo-container">
              <img
                src="/indianai.png"
                alt="AI Avatar"
                className={`mic-image ${isRecording ? "recording" : ""}`}
              />
            </div>
          </div>
          <div className="initial-text-main">Hey There! I am I₹uhh!</div>
          <div className="initial-text-sub">What's holding you back today?</div>
        </div>
      )}
    
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div key={`${msg.sender}-${index}`} className={`message ${msg.sender}`}>
            {msg.structured ? renderStructuredMessage(msg) : msg.text}
          </div>
        ))}

        {isLoading && (
          <div className="message bot typing">
            <span className="typing-dots">•••</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} messages={messages} />
    </div>
  );
};

export default Chatbot;

