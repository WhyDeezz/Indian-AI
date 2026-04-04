import './App.css';
import { useState, useEffect } from 'react';
import Chatbot from "./Components/Chatbot";
import MicRecorder from "./Components/MicRecorder";
import GoalBreakdown from "./Components/GoalBreakdown";
import HabitLogger from "./Components/HabitLogger";
import { requestNotificationPermission, scheduleReminderNotification } from "./utils/reminderNotifications";

function App() {
  const [messages, setMessages] = useState([]);
  const [currentView, setCurrentView] = useState('chat'); // 'chat', 'goals', 'habits'
  const [isRecording, setIsRecording] = useState(false);

  const handleLogoClick = () => {
    // Toggle recording state and pass to MicRecorder
    setIsRecording(!isRecording);
  };

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Listen for new reminder messages and schedule notifications
  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      // If the last message is a reminder response from backend
      if (lastMsg && lastMsg.reply && lastMsg.reply.reminder_time) {
        scheduleReminderNotification(lastMsg.reply);
      }
      // If using /execute endpoint, adapt to lastMsg.response.reminder_time
      if (lastMsg && lastMsg.response && lastMsg.response.reminder_time) {
        scheduleReminderNotification(lastMsg.response);
      }
    }
  }, [messages]);

  const renderCurrentView = () => {
    switch (currentView) {
      case 'goals':
        return (
          <>
            <div className="navigation-bar">
              <button 
                className="nav-btn goals-btn"
                onClick={() => setCurrentView('goals')}
              >
                🎯 Goals
              </button>
              <button 
                className="nav-btn habits-btn"
                onClick={() => setCurrentView('habits')}
              >
                📊 Habits
              </button>
            </div>
            <GoalBreakdown onBack={() => setCurrentView('chat')} />
          </>
        );
      case 'habits':
        return (
          <>
            <div className="navigation-bar">
              <button 
                className="nav-btn goals-btn"
                onClick={() => setCurrentView('goals')}
              >
                🎯 Goals
              </button>
              <button 
                className="nav-btn habits-btn"
                onClick={() => setCurrentView('habits')}
              >
                📊 Habits
              </button>
            </div>
            <HabitLogger onBack={() => setCurrentView('chat')} />
          </>
        );
      default:
        return (
          <>
            <div className="navigation-bar">
              <button 
                className="nav-btn goals-btn"
                onClick={() => setCurrentView('goals')}
              >
                🎯 Goals
              </button>
              <button 
                className="nav-btn habits-btn"
                onClick={() => setCurrentView('habits')}
              >
                📊 Habits
              </button>
            </div>
            <MicRecorder 
              setMessages={setMessages} 
              isRecording={isRecording}
              setIsRecording={setIsRecording}
            />
            <Chatbot 
              messages={messages} 
              setMessages={setMessages}
              onLogoClick={handleLogoClick}
              isRecording={isRecording}
            />
          </>
        );
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="brand-name">
          Indian-AI
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="main-content">
        {renderCurrentView()}
      </div>
      
    </div>
  );
}

export default App;