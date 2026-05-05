// import './App.css';
// import { useState } from 'react';
// import Chatbot from "./Components/Chatbot";
// import GoalBreakdown from "./Components/GoalBreakdown";
// import HabitLogger from "./Components/HabitLogger";
// import IndiaMap from "./Components/India-map/IndiaMap";
// import topo from "@/data/india-states.json";

// function App() {
//   const [messages, setMessages] = useState([]);
//   const [currentView, setCurrentView] = useState('chat');
//   const [selectedState, setSelectedState] = useState(null);

//   const stateNames = topo.features.map((f) => f.properties.st_nm);

//   const renderNavigation = () => (
//     <div className="navigation-bar">
//       <div className="nav-row">
//         <button 
//           className="nav-btn goals-btn"
          // onClick={() => setCurrentView('goals')}
//         >
//           🎯 Goals
//         </button>
//         <button 
//           className="nav-btn habits-btn"
//           onClick={() => setCurrentView('habits')}
//         >
//           📊 Habits
//         </button>
//       </div>
//       <div className="nav-row">
//         <button 
//           className="nav-btn curations-btn"
//           onClick={() => setCurrentView('curations')}
//         >
//           ✨ My Curations
//         </button>
//         <button 
//           className="nav-btn socialize-btn"
//           onClick={() => setCurrentView('socialize')}
//         >
//           🤝 Socialize
//         </button>
//       </div>
//     </div>
//   );

//   const renderCurrentView = () => {
//     switch (currentView) {
//       case 'goals':
//         return <GoalBreakdown onBack={() => setCurrentView('chat')} />;
//       case 'habits':
//         return <HabitLogger onBack={() => setCurrentView('chat')} />;
//       case 'curations':
//         return (
//           <div className="simple-view-panel">
//             <h2>My Curations</h2>
//             <p>This section is ready for saved collections, favorites, and handpicked content.</p>
//             <button className="nav-btn" onClick={() => setCurrentView('chat')}>Back to Chat</button>
//           </div>
//         );
//       case 'socialize':
//         return (
//           <div className="simple-view-panel">
//             <h2>Socialize</h2>
//             <p>This section is ready for community, sharing, and social interaction features.</p>
//             <button className="nav-btn" onClick={() => setCurrentView('chat')}>Back to Chat</button>
//           </div>
//         );
//       default:
//         return (
//           <>
//             {renderNavigation()}
//             <Chatbot 
//               messages={messages} 
//               setMessages={setMessages}
//             />
//           </>
//         );
//     }
//   };

//   return (
//     <div className="app-container">
//       {/* Top Sidebar - Brand */}
//       <div className="sidebar">
//         <div className="brand-name">Indian-AI</div>
//       </div>
      
//       {/* Main Layout - Map Sidebar + Content */}
//       <div className="main-layout">
//         {/* Left Map Sidebar (25%) */}
//         <div className="map-sidebar">
//           <div className="map-container">
//             <IndiaMap
//               activeStates={stateNames}
//               selected={selectedState}
//               onSelect={setSelectedState}
//             />
//           </div>
//           <div className="map-layer-buttons">
//             <button className="layer-btn temperature-btn">🌡️ Temperature</button>
//             <button className="layer-btn attractions-btn">📍 Attractions</button>
//             <button className="layer-btn economy-btn">📊 Economy</button>
//           </div>
//         </div>

//         {/* Right Main Content (75%) */}
//         <div className="main-content">
//           {renderCurrentView()}
//         </div>
//       </div>

//       {/* State Detail Modal */}
//       {selectedState && (
//         <div className="state-detail-modal-overlay" onClick={() => setSelectedState(null)}>
//           <div className="state-detail-modal" onClick={(e) => e.stopPropagation()}>
//             <StateDetail
//               stateName={selectedState}
//               onClose={() => setSelectedState(null)}
//             />
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export defaultapp;

import './App.css';
import { useEffect, useState } from 'react';
import Chatbot from "./Components/Chatbot";
import GoalBreakdown from "./Components/GoalBreakdown";
import HabitLogger from "./Components/HabitLogger";
import IndiaMap from "./Components/India-map/IndiaMap";
import StateDetail from "./Components/India-map/StateDetail";

function App() {
  const [messages, setMessages] = useState([]);
  const [currentView, setCurrentView] = useState('chat');
  const [selectedState, setSelectedState] = useState(null);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setSelectedState(null);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const renderNavigation = () => (
    <div className="navigation-bar">
      <div className="nav-row">
        <button className="nav-btn" onClick={() => setCurrentView('goals')}>🎯 Goals</button>
        <button className="nav-btn" onClick={() => setCurrentView('habits')}>📊 Habits</button>
      </div>
      <div className="nav-row">
        <button className="nav-btn" onClick={() => setCurrentView('curations')}>✨ Curations</button>
        <button className="nav-btn" onClick={() => setCurrentView('socialize')}>🤝 Socialize</button>
      </div>
    </div>
  );

  const renderCurrentView = () => {
    switch (currentView) {
      case 'goals':
        return <GoalBreakdown onBack={() => setCurrentView('chat')} />;
      case 'habits':
        return <HabitLogger onBack={() => setCurrentView('chat')} />;
      case 'curations':
        return <div className="simple-view-panel">Curations</div>;
      case 'socialize':
        return <div className="simple-view-panel">Socialize</div>;
      default:
        return (
          <>
            {renderNavigation()}
            <Chatbot messages={messages} setMessages={setMessages} />
          </>
        );
    }
  };

  return (
    <div className="app-container">
      {/* Left sidebar with India map */}
      <aside className="sidebar">
        <div className="brand-name">INDIAN-AI</div>
        <div className="map-shell">
          <IndiaMap selected={selectedState} onSelect={setSelectedState} />
        </div>
      </aside>

      <main className="main-content">
        {renderCurrentView()}
      </main>

      {selectedState && (
        <div className="state-detail-modal-overlay" onClick={() => setSelectedState(null)}>
          <div className="state-detail-modal" onClick={(event) => event.stopPropagation()}>
            <StateDetail stateName={selectedState} onClose={() => setSelectedState(null)} />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;