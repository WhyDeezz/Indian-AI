import React, { useState, useEffect, useRef } from "react";

const ChatInput = ({ onSendMessage, isLoading, messages }) => {
  const [inputText, setInputText] = useState("");
  const [isInitialPosition, setIsInitialPosition] = useState(true);
  const inputRef = useRef(null);

  useEffect(() => {
    if (messages.length > 0) {
      setIsInitialPosition(false);
    }
  }, [messages]);

  // Auto-focus input after each message
  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading]);

  const handleSend = () => {
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText);
    setInputText("");
  };

  const canSend = inputText.trim().length > 0 && !isLoading;

  return (
    <>
      <style>{`
        @keyframes inputAppear {
          from { opacity: 0; transform: translateX(-50%) translateY(10px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .chat-input {
          animation: inputAppear 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .chat-input input:focus {
          border-color: rgba(63, 124, 255, 0.8) !important;
          box-shadow: 0 0 0 3px rgba(63, 124, 255, 0.18) !important;
        }
        .send-btn {
          transition: transform 160ms ease, box-shadow 160ms ease, opacity 160ms ease, background 160ms ease !important;
        }
        .send-btn:not(:disabled):hover {
          transform: translateY(-1px) !important;
          box-shadow: 0 10px 22px rgba(63, 124, 255, 0.35) !important;
        }
        .send-btn:not(:disabled):active {
          transform: scale(0.96) !important;
          box-shadow: none !important;
        }
        .send-btn:disabled {
          background: rgba(255,255,255,0.08) !important;
          color: rgba(255,255,255,0.3) !important;
          cursor: not-allowed !important;
          box-shadow: none !important;
        }
        .send-btn-dots span {
          display: inline-block;
          width: 5px; height: 5px;
          border-radius: 50%;
          background: rgba(255,255,255,0.6);
          animation: bounce 1.1s infinite;
        }
        .send-btn-dots span:nth-child(2) { animation-delay: 0.15s; }
        .send-btn-dots span:nth-child(3) { animation-delay: 0.3s; }
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>

      <div className={`chat-input ${isInitialPosition ? "initial-position" : "bottom-position"}`}>
        <input
          ref={inputRef}
          type="text"
          id="chat-input-field"
          name="message"
          placeholder="Type a message..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyUp={(e) => e.key === "Enter" && handleSend()}
          disabled={isLoading}
          autoComplete="off"
        />

        <button
          className="send-btn"
          onClick={handleSend}
          disabled={!canSend}
          style={{
            minWidth: "96px",
            padding: "0.95rem 1.3rem",
            border: 0,
            borderRadius: "1rem",
            color: "#fff",
            background: canSend
              ? "linear-gradient(135deg, #4c87ff, #2454d8)"
              : "rgba(255,255,255,0.08)",
            fontSize: "1rem",
            fontWeight: 700,
            cursor: canSend ? "pointer" : "not-allowed",
          }}
        >
          {isLoading ? (
            <span className="send-btn-dots" style={{ display: "flex", gap: 4, alignItems: "center", justifyContent: "center" }}>
              <span /><span /><span />
            </span>
          ) : (
            <span style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
              
              <svg
                width="13" height="13" viewBox="0 0 13 13" fill="none"
                style={{ opacity: canSend ? 1 : 1, transition: "opacity 0.2s ease" }}
              >
                <path d="M2 6.5h9M8 3l3.5 3.5L8 10" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          )}
        </button>
      </div>
    </>
  );
};

export default ChatInput;