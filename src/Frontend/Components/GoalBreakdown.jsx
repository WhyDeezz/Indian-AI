import React, { useState } from 'react';
import './GoalBreakdown.css';

const GoalBreakdown = ({ onBack }) => {
  const [goal, setGoal] = useState('');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState(new Set());

  const handleGoalBreakdown = async () => {
    if (!goal.trim()) return;
    
    setLoading(true);
    
    try {
      const response = await fetch('https://ruhaan-336f0cf6b1b5.herokuapp.com/api/command/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command: `break down: ${goal}`
        }),
      });

      const data = await response.json();
      
      if (data.response) {
        console.log('Received response:', data.response);
        
        // Parse the Sarvam AI response to extract structured steps and checkpoints
        const responseText = data.response;
        console.log('🔍 Raw response received:', responseText.substring(0, 500));
        
        // Simple and accurate parsing for Step X: format with bullet points
        let parsedTasks = [];
        
        // Split by steps and process each one
        const stepSections = responseText.split(/Step\s+(\d+):/i);
        console.log(`📋 Found ${Math.floor(stepSections.length / 2)} step sections`);
        
        for (let i = 1; i < stepSections.length; i += 2) {
          const stepNumber = parseInt(stepSections[i]);
          const stepContent = stepSections[i + 1] || '';
          
          // Extract step title (first line)
          const lines = stepContent.trim().split('\n');
          const stepTitle = lines[0]?.trim() || `Step ${stepNumber}`;
          
          console.log(`🔍 Processing Step ${stepNumber}: ${stepTitle}`);
          
          // Extract checkpoints (lines starting with • or -)
          const checkpoints = [];
          for (const line of lines) {
            const cleanLine = line.trim();
            if (cleanLine.startsWith('•') || cleanLine.startsWith('-')) {
              const checkpoint = cleanLine.replace(/^[•\-]\s*/, '').trim();
              if (checkpoint.length > 10) { // Only meaningful checkpoints
                checkpoints.push(checkpoint);
              }
            }
          }
          
          // Limit to exactly 4 checkpoints as requested in backend
          const limitedCheckpoints = checkpoints.slice(0, 4);
          
          console.log(`✅ Step ${stepNumber} has ${limitedCheckpoints.length} checkpoints`);
          
          if (limitedCheckpoints.length > 0) {
            const subTasks = limitedCheckpoints.map((checkpoint, idx) => ({
              id: `${stepNumber}.${idx + 1}`,
              text: checkpoint,
              completed: false,
              type: 'checkpoint'
            }));
            
            parsedTasks.push({
              id: stepNumber,
              text: stepTitle,
              completed: false,
              fullText: stepContent,
              subTasks: subTasks
            });
          }
        }
        
        // If no steps found with the main pattern, try fallback
        if (parsedTasks.length === 0) {
          console.log('🔄 No steps found, trying fallback parsing...');
          
          // Try numbered list format (1. 2. 3.)
          const numberedSections = responseText.split(/(\d+)\.\s+/);
          
          for (let i = 1; i < numberedSections.length; i += 2) {
            const stepNumber = parseInt(numberedSections[i]);
            const stepContent = numberedSections[i + 1] || '';
            
            const lines = stepContent.trim().split('\n');
            const stepTitle = lines[0]?.trim() || `Step ${stepNumber}`;
            
            // Look for bullet points in this section
            const checkpoints = [];
            for (const line of lines) {
              const cleanLine = line.trim();
              if (cleanLine.startsWith('•') || cleanLine.startsWith('-')) {
                const checkpoint = cleanLine.replace(/^[•\-]\s*/, '').trim();
                if (checkpoint.length > 10) {
                  checkpoints.push(checkpoint);
                }
              }
            }
            
            const limitedCheckpoints = checkpoints.slice(0, 4);
            
            if (limitedCheckpoints.length > 0) {
              const subTasks = limitedCheckpoints.map((checkpoint, idx) => ({
                id: `${stepNumber}.${idx + 1}`,
                text: checkpoint,
                completed: false,
                type: 'checkpoint'
              }));
              
              parsedTasks.push({
                id: stepNumber,
                text: stepTitle,
                completed: false,
                fullText: stepContent,
                subTasks: subTasks
              });
            }
          }
        }
        
        // If still no parsed tasks, show debug info
        if (parsedTasks.length === 0) {
          console.log('❌ No step structure found in API response');
          console.log('📋 Full response text:', responseText);
          
          // Create a single debug task to show the raw response
          parsedTasks = [{
            id: 1,
            text: "⚠️ Could not parse response - check console for details",
            completed: false,
            fullText: responseText,
            subTasks: [{
              id: '1.1',
              text: responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''),
              completed: false,
              type: 'debug'
            }]
          }];
        }
        
        console.log(`🎯 Final parsed tasks: ${parsedTasks.length} steps found`);
        parsedTasks.forEach((task, idx) => {
          console.log(`  Step ${task.id}: "${task.text}" with ${task.subTasks.length} checkpoints`);
        });
        
        setTasks(parsedTasks);
        // Expand all tasks by default to show checkpoints
        setExpandedTasks(new Set(parsedTasks.map(task => task.id)));
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error breaking down goal. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = (taskId) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        const newCompleted = !task.completed;
        
        // If marking main task as completed, mark all sub-tasks as completed
        if (newCompleted) {
          return {
            ...task, 
            completed: newCompleted,
            subTasks: task.subTasks.map(sub => ({ ...sub, completed: true }))
          };
        } else {
          return { ...task, completed: newCompleted };
        }
      }
      return task;
    }));
  };

  const toggleSubTask = (taskId, subTaskId) => {
    setTasks(tasks.map(task => {
      if (task.id === taskId) {
        const updatedSubTasks = task.subTasks.map(sub => 
          sub.id === subTaskId ? { ...sub, completed: !sub.completed } : sub
        );
        
        // Check if all sub-tasks are completed to auto-complete main task
        const allSubTasksCompleted = updatedSubTasks.every(sub => sub.completed);
        
        return {
          ...task,
          subTasks: updatedSubTasks,
          completed: allSubTasksCompleted
        };
      }
      return task;
    }));
  };

  const toggleTaskExpansion = (taskId) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  return (
    <div className="goal-breakdown-container">
      <div className="goal-breakdown-header">
        <button 
          onClick={onBack}
          className="back-button"
        >
          ←
        </button>
        <h1 className="goal-breakdown-title">
          🎯 Goal Breakdown
        </h1>
      </div>

      <div className="goal-input-section">
        <h2 className="goal-input-title">
          What's your goal?
        </h2>
        <div className="goal-input-container">
          <input
            type="text"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="Enter your goal (e.g., Learn React, Start a YouTube channel, Lose 10kg)"
            className="goal-input"
            onKeyPress={(e) => e.key === 'Enter' && handleGoalBreakdown()}
          />
          <button
            onClick={handleGoalBreakdown}
            disabled={loading || !goal.trim()}
            className="breakdown-button"
          >
            {loading ? 'Breaking down...' : 'Break Down'}
          </button>
        </div>
      </div>

      {tasks.length > 0 && (
        <div className="tasks-section">
          <h2 className="tasks-title">
            📋 Action Plan ({tasks.filter(t => t.completed).length}/{tasks.length} main tasks completed)
          </h2>
          
          {/* Progress Bar */}
          <div className="progress-section">
            <div className="progress-header">
              <span className="progress-label">
                Overall Progress
              </span>
              <span className="progress-percentage">
                {Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100)}%
              </span>
            </div>
            <div className="progress-bar-background">
              <div 
                className="progress-bar-fill"
                style={{
                  width: `${(tasks.filter(t => t.completed).length / tasks.length) * 100}%`
                }}
              />
            </div>
          </div>
          
          <div className="tasks-container">
            {tasks.map((task) => (
              <div 
                key={task.id} 
                className={`task-card ${task.completed ? 'completed' : 'incomplete'}`}
              >
                {/* Main Task */}
                <div
                  className={`task-header ${task.completed ? 'completed' : 'incomplete'}`}
                  onClick={() => toggleTaskExpansion(task.id)}
                >
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleTask(task.id);
                    }}
                    className="task-checkbox"
                  />
                  <span className={`task-text ${task.completed ? 'completed' : 'incomplete'}`}>
                    {task.id}. {task.text}
                  </span>
                  <span className="task-subtask-count">
                    {task.subTasks.filter(sub => sub.completed).length}/{task.subTasks.length} sub-tasks
                  </span>
                  <span className={`task-expand-icon ${expandedTasks.has(task.id) ? 'expanded' : 'collapsed'}`}>
                    ▼
                  </span>
                </div>

                {/* Sub-tasks */}
                {expandedTasks.has(task.id) && (
                  <div className="subtasks-container">
                    <div className="subtasks-list">
                      {task.subTasks.map((subTask) => (
                        <div
                          key={subTask.id}
                          onClick={() => toggleSubTask(task.id, subTask.id)}
                          className={`subtask-item ${subTask.completed ? 'completed' : 'incomplete'}`}
                        >
                          <input
                            type="checkbox"
                            checked={subTask.completed}
                            onChange={() => toggleSubTask(task.id, subTask.id)}
                            className="subtask-checkbox"
                          />
                          <span className={`subtask-text ${subTask.completed ? 'completed' : 'incomplete'}`}>
                            {subTask.text}
                          </span>
                          {subTask.completed && (
                            <span className="subtask-check-mark">
                              ✓
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {tasks.length > 0 && tasks.every(t => t.completed) && (
            <div className="completion-celebration">
              <div className="celebration-emoji">🎉</div>
              <h3 className="celebration-text">
                Congratulations! Goal completed!
              </h3>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GoalBreakdown;
