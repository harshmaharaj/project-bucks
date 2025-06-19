
import React from 'react';
import { Play, Square, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatTime, calculateEarnings, getCurrentSessionTime, getWeeklyProgress } from '@/utils/timeUtils';

interface Project {
  id: string;
  name: string;
  hourly_rate: number;
  rate_currency: string;
  committed_weekly_hours: number;
  total_time: number;
  is_running: boolean;
  start_time?: number;
  user_id: string;
  user_email?: string;
  sessions: any[];
}

interface ProjectCardProps {
  project: Project;
  userRole: 'super_admin' | 'user' | null;
  currentUserId?: string;
  onStartTimer: (projectId: string) => void;
  onStopTimer: (projectId: string) => void;
}

const ProjectCard = ({ project, userRole, currentUserId, onStartTimer, onStopTimer }: ProjectCardProps) => {
  const currentSessionTime = getCurrentSessionTime(project);
  const totalTimeWithSession = project.total_time + currentSessionTime;
  const weeklyProgress = getWeeklyProgress(totalTimeWithSession, project.committed_weekly_hours);

  const canControlTimer = userRole !== 'super_admin' && project.user_id === currentUserId;

  return (
    <Card className="overflow-hidden shadow-lg border-0 bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-gray-900">{project.name}</CardTitle>
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center">
            <DollarSign className="w-4 h-4 mr-1" />
            {project.hourly_rate} {project.rate_currency}/hour
          </div>
          <div className="text-xs">
            {project.committed_weekly_hours}h/week
          </div>
        </div>
        {userRole === 'super_admin' && (
          <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
            Owner: {project.user_email}
          </div>
        )}
        {/* Weekly Progress Bar */}
        <div className="mt-2">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Weekly Progress</span>
            <span>{(totalTimeWithSession / 3600).toFixed(1)}h / {project.committed_weekly_hours}h</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${weeklyProgress}%` }}
            ></div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Time Display */}
        <div className="text-center">
          <div className="text-3xl font-mono font-bold text-gray-900 mb-1">
            {formatTime(totalTimeWithSession)}
          </div>
          <div className="text-sm text-gray-600">
            Earnings: {project.rate_currency} {calculateEarnings(totalTimeWithSession, project.hourly_rate)}
          </div>
        </div>

        {/* Control Button - Only for project owner or if it's the user's own project */}
        {canControlTimer && (
          <div className="flex justify-center">
            {project.is_running ? (
              <Button
                onClick={() => onStopTimer(project.id)}
                className="w-full h-14 text-lg bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
              >
                <Square className="w-6 h-6 mr-2" />
                Stop Timer
              </Button>
            ) : (
              <Button
                onClick={() => onStartTimer(project.id)}
                className="w-full h-14 text-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
              >
                <Play className="w-6 h-6 mr-2" />
                Start Timer
              </Button>
            )}
          </div>
        )}

        {/* Session Count */}
        {project.sessions.length > 0 && (
          <div className="text-center text-sm text-gray-500">
            {project.sessions.length} session{project.sessions.length !== 1 ? 's' : ''} recorded
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectCard;
