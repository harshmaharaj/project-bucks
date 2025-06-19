
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

export const getWeeklyProgress = (totalTime: number, committedWeeklyHours: number) => {
  const hours = totalTime / 3600;
  const percentage = (hours / committedWeeklyHours) * 100;
  return Math.min(percentage, 100);
};
