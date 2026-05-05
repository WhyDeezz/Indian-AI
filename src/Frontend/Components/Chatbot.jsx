import React, { useState, useRef, useEffect } from "react";
import ChatInput from "./ChatInput";
import { processTextQuery } from "./api";

const Chatbot = ({ messages, setMessages }) => {
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

    // Frontend-only hardcoded replies for launch/demo mode.
    const normalizedMessage = (messageText || "").trim().toLowerCase();
    if (normalizedMessage === "hi") {
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          text: "hi I am Indian AI, Of the People, By the people, for the people !",
          sender: "bot",
          structured: false,
        },
      ]);
      setIsLoading(false);
      return;
    }

    if (normalizedMessage === "how many indian ais are available") {
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          text: "1. Indian-AI 🤓",
          sender: "bot",
          structured: false,
        },
      ]);
      setIsLoading(false);
      return;
    }
    

    
    const startTime = Date.now();
  
    try {
      const response = await processTextQuery(messageText, languageCode);
      
      let data = response.data.data || response.data;
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch (e) {
          console.error("Failed to parse stringified data:", data);
        }
      }
      const botReply = data.response;
      const voiceMessage = data.voice_message;
      const langCode = data.language_code;
      const isStructured = typeof data.type === "string" && data.type === "structured" && typeof botReply === "object" && botReply !== null;

      if (isStructured) {
        setMessages((prevMessages) => [
          ...prevMessages,
          { text: botReply, sender: "bot", structured: true },
        ]);
        return;
      }

      console.warn("Unexpected response format:", { data, botReply, voiceMessage, langCode });
      const fallbackMessage = "I couldn't format the response. Please try again.";
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: fallbackMessage, sender: "bot", structured: false },
      ]);
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

    const sections = [
      { key: "health", title: "Health", color: "#4a90e2" },
      { key: "family", title: "Family", color: "#50c878" },
      { key: "dream", title: "Dreams", color: "#e67e22" },
      { key: "society", title: "Society", color: "#9b59b6" }
    ];

    return (
      <div className="structured-response">
        {sections.map(section => {
          const content = message.text[section.key];
          if (!content) {
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
          <div className="hero-logo-trigger">
            <div className="logo-container">
              <img
                src="/indianai.png"
                alt="AI Avatar"
                className="mic-image"
              />
            </div>
          </div>
          <div className="initial-text-main">Hey There! I am I₹uhh!</div>
          <div className="initial-text-sub">What's holding you back today?</div>
        </div>
      )}
    
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div
            key={`${msg.sender}-${index}`}
            className={`message ${msg.sender} ${msg.structured ? "structured-message" : ""}`}
          >
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

