
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Square, DollarSign, MoreVertical, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatTime, calculateEarnings, getWeeklyProgress, getWeeklyTime } from '@/utils/timeUtils';
import SliderButton from '@/components/ui/slider-button';

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
  onDeleteProject?: (projectId: string) => void;
}

const ProjectCard = ({ 
  project, 
  userRole, 
  currentUserId, 
  onStartTimer, 
  onStopTimer,
  onDeleteProject
}: ProjectCardProps) => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Update current time every second for running timers
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (project.is_running) {
      interval = setInterval(() => {
        setCurrentTime(Date.now());
      }, 1000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [project.is_running]);

  // Calculate current session time in seconds
  const getCurrentSessionTime = () => {
    if (!project.is_running || !project.start_time) {
      return 0;
    }
    return Math.floor((currentTime - project.start_time) / 1000);
  };

  const currentSessionTime = getCurrentSessionTime();
  const totalTimeWithSession = project.total_time + currentSessionTime;
  const weeklyProgress = getWeeklyProgress(project.sessions || [], project.committed_weekly_hours, currentSessionTime);

  const canControlTimer = userRole !== 'super_admin' && project.user_id === currentUserId;
  const canManageProject = userRole === 'super_admin' || project.user_id === currentUserId;

  const handleViewProject = () => {
    navigate(`/project/${project.id}`);
  };

  const handleDeleteProject = () => {
    if (onDeleteProject) {
      onDeleteProject(project.id);
    }
    setIsDeleteDialogOpen(false);
  };


  return (
    <>
      <Card className="overflow-hidden shadow-lg border-0 bg-white">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900 flex-1">{project.name}</CardTitle>
            {canManageProject && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-white border shadow-lg">
                  <DropdownMenuItem onClick={handleViewProject} className="cursor-pointer">
                    <Eye className="mr-2 h-4 w-4" />
                    View project
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setIsDeleteDialogOpen(true)} 
                    className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete project
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center">
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
              <span>{(getWeeklyTime(project.sessions || [], currentSessionTime) / 3600).toFixed(1)}h / {project.committed_weekly_hours}h</span>
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
            {project.is_running && (
              <div className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded-full inline-block mb-2">
                ● Timer Running
              </div>
            )}
            <div className="text-sm text-gray-600">
              Earnings: {project.rate_currency} {calculateEarnings(totalTimeWithSession, project.hourly_rate)}
            </div>
          </div>

          {/* Control Slider - Only for project owner or if it's the user's own project */}
          {canControlTimer && (
            <div className="flex justify-center">
              {project.is_running ? (
                <SliderButton
                  onSlideComplete={() => onStopTimer(project.id)}
                  text="Slide to stop Timer"
                  variant="stop"
                  isActive={true}
                  className="w-full"
                />
              ) : (
                <SliderButton
                  onSlideComplete={() => onStartTimer(project.id)}
                  text="Slide to start Timer"
                  variant="start"
                  isActive={false}
                  className="w-full"
                />
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

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Project</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{project.name}"? This action cannot be undone and will remove all associated time sessions.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteProject}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Card>
    </>
  );
};

export default ProjectCard;
