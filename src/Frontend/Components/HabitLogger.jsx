import React, { useState, useEffect } from 'react';

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
    <div className="min-h-screen w-full max-w-screen overflow-x-hidden box-border p-5 md:p-[15px]">
      <div className="flex items-center mb-[30px] text-white">
        <button 
          onClick={onBack}
          className="mr-[15px] rounded-xl border border-blue-500/30 bg-blue-500/15 px-[15px] py-[10px] text-white backdrop-blur-md transition-all duration-200 hover:-translate-y-px hover:bg-blue-500/25"
        >
          ← Back
        </button>
        <h1 className="m-0 bg-gradient-to-br from-blue-500 to-blue-700 bg-clip-text text-[32px] font-bold text-transparent drop-shadow md:text-2xl">
          Habit Logger
        </h1>
      </div>

      <div className="mb-[30px] w-full max-w-[calc(100vw-40px)] rounded-[20px] border border-white/20 bg-blue-500/10 p-[25px] shadow-lg backdrop-blur-xl box-border md:max-w-[calc(100vw-30px)] md:p-5">
        <h2 className="mb-5 text-xl font-semibold text-white">
          Add New Habit
        </h2>
        <div className="flex items-center gap-[15px] md:flex-col md:gap-[10px]">
          <input
            type="text"
            value={newHabit}
            onChange={(e) => setNewHabit(e.target.value)}
            placeholder="Enter habit name (e.g., exercise, meditate, read)"
            className="flex-1 rounded-xl border border-blue-500/30 bg-blue-500/10 px-[18px] py-[14px] text-base text-white backdrop-blur-md transition-all duration-200 placeholder:text-white/60 focus:border-blue-500/60 focus:outline-none focus:ring-4 focus:ring-blue-500/20 md:w-full"
            onKeyPress={(e) => e.key === 'Enter' && addHabit()}
            disabled={loading}
          />
          <button
            onClick={addHabit}
            disabled={loading || !newHabit.trim()}
            className="rounded-xl px-6 py-[14px] text-base font-semibold text-white transition-all duration-200 enabled:bg-gradient-to-br enabled:from-blue-500 enabled:to-blue-700 enabled:hover:-translate-y-0.5 enabled:hover:shadow-lg enabled:hover:shadow-blue-500/40 disabled:cursor-not-allowed disabled:bg-gray-300 md:w-full"
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
