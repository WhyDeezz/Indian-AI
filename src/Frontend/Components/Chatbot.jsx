import React, { useState, useRef, useEffect } from "react";
import ChatInput from "./ChatInput.jsx";
import { processTextQuery } from "./api";

const Chatbot = ({ messages, setMessages }) => {
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

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
      const isStructured =
        typeof data.type === "string" &&
        data.type === "structured" &&
        typeof botReply === "object" &&
        botReply !== null;

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
      { key: "health",  title: "Health",  accent: "border-l-blue-500",   label: "text-blue-400"   },
      { key: "family",  title: "Family",  accent: "border-l-green-500",  label: "text-green-400"  },
      { key: "dream",   title: "Dreams",  accent: "border-l-orange-400", label: "text-orange-400" },
      { key: "society", title: "Society", accent: "border-l-purple-500", label: "text-purple-400" },
    ];

    return (
      <div className="grid grid-cols-2 gap-3 w-full max-w-xl mt-1">
        {sections.map((section, i) => {
          const content = message.text[section.key];
          if (!content) return null;
          return (
            <div
              key={section.key}
              className={`bg-white/5 border border-white/10 border-l-2 ${section.accent} rounded-xl p-4
                hover:bg-white/10 transition-all duration-300`}
              style={{
                animation: `fadeSlideUp 0.35s ease both`,
                animationDelay: `${i * 0.07}s`,
              }}
            >
              <h3 className={`text-xs font-semibold uppercase tracking-widest mb-2 ${section.label}`}>
                {section.title}
              </h3>
              <p className="text-sm text-white/65 leading-relaxed">
                {content.analysis || content.perspective || content.story || content.framework}
              </p>
              {content.key_points && content.key_points.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {content.key_points.map((point, index) => (
                    <li key={index} className="text-xs text-white/45 flex gap-2 items-start">
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-white/30 flex-shrink-0" />
                      {point}
                    </li>
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
    <div className="chatbot-interface flex flex-col w-full h-full">

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes subtlePulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.5); }
          50%       { box-shadow: 0 0 0 6px rgba(34,197,94,0); }
        }
        @keyframes avatarFloat {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(0px); }
        }
        .msg-appear {
          animation: fadeSlideIn 0.25s ease both;
        }
        .avatar-float {
          animation: avatarFloat 4s ease-in-out infinite;
        }
        .status-pulse {
          animation: subtlePulse 2s ease-in-out infinite;
        }
        .chat-messages::-webkit-scrollbar { width: 3px; }
        .chat-messages::-webkit-scrollbar-track { background: transparent; }
        .chat-messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }
      `}</style>

      {/* Empty / hero state */}
      {messages.length === 0 && (
        <div
          className="flex flex-col items-center justify-center flex-1 gap-5 text-center px-8"
          style={{ animation: "fadeSlideUp 0.5s ease both" }}
        >
          <div className="relative avatar-float">
            <img
              src="/indianai.png"
              alt="AI Avatar"
              className="mic-image rounded-full object-cover shadow-2xl"
              style={{
                width: "80px",
                height: "80px",
                minWidth: "80px",
                minHeight: "80px",
                boxShadow: "0 0 40px rgba(255,153,51,0.15), 0 0 80px rgba(19,136,8,0.1)",
              }}
            />
            <span
              className="status-pulse absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-black"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <p className="text-3xl font-bold text-white tracking-tight">Hey There! I am I₹uhh!</p>
            <p className="text-base text-white/40">What's holding you back today?</p>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="chat-messages flex flex-col flex-1 overflow-y-auto px-4 pt-32 pb-4">
        {messages.map((msg, index) => (
          <div
            key={`${msg.sender}-${index}`}
            className={`msg-appear flex items-end gap-3 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}
            style={{ animationDelay: `${Math.min(index * 0.04, 0.2)}s` }}
          >
            {/* Bot avatar */}
            {msg.sender === "bot" && (
              <div className="w-7 h-7 rounded-full bg-white/8 border border-white/10 flex items-center justify-center text-[8px] font-bold text-white/50 flex-shrink-0 mb-0.5 transition-transform duration-200 hover:scale-110">
                I₹
              </div>
            )}

            {msg.structured ? (
              renderStructuredMessage(msg)
            ) : (
              <div
                className={`max-w-[60%] px-5 py-3 text-sm leading-relaxed rounded-2xl transition-all duration-200 ${
                  msg.sender === "user"
                    ? "bg-white text-gray-900 rounded-br-sm shadow-lg hover:shadow-xl hover:-translate-y-px"
                    : "bg-white/8 text-white/90 rounded-bl-sm border border-white/10 hover:bg-white/12"
                }`}
              >
                {msg.text}
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {isLoading && (
          <div className="msg-appear flex items-end gap-3">
            <div className="w-7 h-7 rounded-full bg-white/8 border border-white/10 flex items-center justify-center text-[8px] font-bold text-white/50 flex-shrink-0">
              I₹
            </div>
            <div className="flex gap-1.5 items-center bg-white/8 border border-white/10 px-5 py-3.5 rounded-2xl rounded-bl-sm">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-white/40 inline-block animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="w-full">
        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} messages={messages} />
      </div>
    </div>
  );
};

export default Chatbot;