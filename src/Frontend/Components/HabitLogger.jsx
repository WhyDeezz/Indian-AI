import React, { useState, useEffect } from 'react';
import './HabitLogger.css';

const HabitLogger = ({ onBack }) => {
  const [habits, setHabits] = useState([]);
  const [newHabit, setNewHabit] = useState('');
  const [loading, setLoading] = useState(false);

  const addHabit = async () => {
    if (!newHabit.trim()) return;
    
    setLoading(true);
    
    try {
      const response = await fetch('https://www.indian-ai.com/api/command/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command: `log habit: ${newHabit}`
        }),
      });

      const data = await response.json();
      console.log('Add habit response:', data); // Debug log
      
      if (response.ok && data.response) {
        console.log('Habit added successfully:', data.response);
        setNewHabit('');
        // Add to local state
        const habitName = newHabit.toLowerCase();
        if (!habits.find(h => h.name === habitName)) {
          setHabits([...habits, {
            name: habitName,
            streak: 1,
            lastLogged: new Date().toDateString()
          }]);
        }
      } else {
        console.error('Server error:', data);
      }
    } catch (error) {
      console.error('Network error:', error);
    } finally {
      setLoading(false);
    }
  };

  const logHabit = async (habitName) => {
    setLoading(true);
    
    // Find current habit to get streak info
    const currentHabit = habits.find(h => h.name === habitName);
    const newStreak = currentHabit ? currentHabit.streak + 1 : 1;
    
    try {
      const response = await fetch('https://www.indian-ai.com/api/command/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command: `log habit: ${habitName}`
        }),
      });

      const data = await response.json();
      console.log('Log habit response:', data); // Debug log
      
      if (response.ok && data.response) {
        console.log('Habit logged successfully:', data.response);
        // Update local state
        setHabits(habits.map(habit => 
          habit.name === habitName 
            ? { ...habit, lastLogged: new Date().toDateString(), streak: habit.streak + 1 }
            : habit
        ));
      } else {
        console.error('Server error:', data);
      }
    } catch (error) {
      console.error('Network error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExistingHabits = async () => {
    try {
      const response = await fetch('https://www.indian-ai.com/api/command/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command: 'list habits'
        }),
      });

      const data = await response.json();
      
      if (data.response && data.response !== "📋 No habits tracked yet. Start with 'Log habit: [habit name]'") {
        console.log('Existing habits:', data.response);
        // Parse the habit list and extract habit data
        // The response format is like: "📋 Your Habits (2):\n• Read Books - ✅ Done today (Streak: 1)\n• Went Gym - ✅ Done today (Streak: 1)"
        
        const lines = data.response.split('\n');
        const habitLines = lines.filter(line => line.startsWith('•'));
        
        const parsedHabits = habitLines.map(line => {
          // Parse: "• Read Books - ✅ Done today (Streak: 1)"
          const match = line.match(/• (.+?) - (✅ Done today|⏸️ Pending) \(Streak: (\d+)\)/);
          if (match) {
            const [, name, status, streak] = match;
            return {
              name: name.toLowerCase(),
              streak: parseInt(streak),
              lastLogged: status === '✅ Done today' ? new Date().toDateString() : null
            };
          }
          return null;
        }).filter(Boolean);
        
        setHabits(parsedHabits);
      }
    } catch (error) {
      console.error('Error loading existing habits:', error);
    }
  };

  useEffect(() => {
    loadExistingHabits();
  }, []);

  return (
    <div className="habit-logger-container">
      <div className="habit-logger-header">
        <button 
          onClick={onBack}
          className="back-button"
        >
          ← Back
        </button>
        <h1 className="habit-logger-title">
          📊 Habit Logger
        </h1>
      </div>

      <div className="habit-input-section">
        <h2 className="habit-input-title">
          Add New Habit
        </h2>
        <div className="habit-input-container">
          <input
            type="text"
            value={newHabit}
            onChange={(e) => setNewHabit(e.target.value)}
            placeholder="Enter habit name (e.g., exercise, meditate, read)"
            className="habit-input"
            onKeyPress={(e) => e.key === 'Enter' && addHabit()}
            disabled={loading}
          />
          <button
            onClick={addHabit}
            disabled={loading || !newHabit.trim()}
            className="add-habit-button"
          >
            {loading ? 'Adding...' : 'Add Habit'}
          </button>
        </div>
      </div>

      {habits.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          {habits.map((habit, index) => (
            <div
              key={index}
              style={{
                background: 'rgba(59, 130, 246, 0.1)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '16px',
                padding: '25px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#ffffff',
                  margin: 0,
                  textTransform: 'capitalize'
                }}>
                  {habit.name}
                </h3>
                <button
                  onClick={() => logHabit(habit.name)}
                  disabled={loading || habit.lastLogged === new Date().toDateString()}
                  style={{
                    background: habit.lastLogged === new Date().toDateString() 
                      ? '#28a745' 
                      : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  {habit.lastLogged === new Date().toDateString() ? '✓ Done Today' : 'Log Today'}
                </button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>Current Streak:</span>
                  <span style={{ fontSize: '18px', fontWeight: '700', color: '#3b82f6' }}>
                    🔥 {habit.streak} days
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)' }}>Last Logged:</span>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>
                    {habit.lastLogged}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '50px',
          background: 'rgba(59, 130, 246, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          borderRadius: '16px',
          marginBottom: '30px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>📊</div>
          <h3 style={{ fontSize: '24px', color: '#ffffff', marginBottom: '10px' }}>
            No habits yet!
          </h3>
          <p style={{ fontSize: '16px', color: '#666', margin: 0 }}>
            Add your first habit above to start tracking your progress.
          </p>
        </div>
      )}
    </div>
  );
};

export default HabitLogger;
