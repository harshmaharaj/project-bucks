
export const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const calculateEarnings = (totalTime: number, hourlyRate: number) => {
  const hours = totalTime / 3600;
  return (hours * hourlyRate).toFixed(2);
};

export const getCurrentSessionTime = (project: { is_running: boolean; start_time?: number }) => {
  if (!project.is_running || !project.start_time) return 0;
  return Math.floor((Date.now() - project.start_time) / 1000);
};

// Get the start of the current week (Monday at 00:00:00)
export const getWeekStart = (date: Date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Calculate total time for sessions within the current week
export const getWeeklyTime = (sessions: Array<{ start_time: number; duration: number; end_time?: number | null }>, currentSessionTime: number = 0) => {
  const weekStart = getWeekStart();
  const weekStartTimestamp = weekStart.getTime();
  
  // Filter sessions that started in the current week
  const weekSessions = sessions.filter(session => session.start_time >= weekStartTimestamp);
  
  // Sum up the duration of completed sessions
  const completedTime = weekSessions.reduce((total, session) => {
    return total + session.duration;
  }, 0);
  
  // Add current running session time if applicable
  return completedTime + currentSessionTime;
};

export const getWeeklyProgress = (sessions: Array<{ start_time: number; duration: number; end_time?: number | null }>, committedWeeklyHours: number, currentSessionTime: number = 0) => {
  const weeklyTime = getWeeklyTime(sessions, currentSessionTime);
  const hours = weeklyTime / 3600;
  const percentage = (hours / committedWeeklyHours) * 100;
  return Math.min(percentage, 100);
};
