
import React, { useState, useEffect } from 'react';
import { Plus, Play, Square, Clock, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface Project {
  id: string;
  name: string;
  hourlyRate: number;
  totalTime: number; // in seconds
  isRunning: boolean;
  startTime?: number;
  sessions: TimeSession[];
}

interface TimeSession {
  id: string;
  startTime: number;
  endTime?: number;
  duration: number; // in seconds
}

const Index = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectRate, setNewProjectRate] = useState<number>(50);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  // Load projects from localStorage on component mount
  useEffect(() => {
    const savedProjects = localStorage.getItem('timeTracker_projects');
    if (savedProjects) {
      try {
        const parsedProjects = JSON.parse(savedProjects);
        setProjects(parsedProjects);
      } catch (error) {
        console.error('Failed to parse saved projects:', error);
      }
    }
  }, []);

  // Save projects to localStorage whenever projects change
  useEffect(() => {
    localStorage.setItem('timeTracker_projects', JSON.stringify(projects));
  }, [projects]);

  // Update running timers every second
  useEffect(() => {
    const interval = setInterval(() => {
      setProjects(prevProjects => 
        prevProjects.map(project => {
          if (project.isRunning && project.startTime) {
            const currentTime = Date.now();
            const sessionTime = Math.floor((currentTime - project.startTime) / 1000);
            return {
              ...project,
              totalTime: project.totalTime + sessionTime - (project.sessions[project.sessions.length - 1]?.duration || 0)
            };
          }
          return project;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const createProject = () => {
    if (!newProjectName.trim()) {
      toast({
        title: "Error",
        description: "Project name is required",
        variant: "destructive"
      });
      return;
    }

    const newProject: Project = {
      id: Date.now().toString(),
      name: newProjectName.trim(),
      hourlyRate: newProjectRate,
      totalTime: 0,
      isRunning: false,
      sessions: []
    };

    setProjects(prev => [...prev, newProject]);
    setNewProjectName('');
    setNewProjectRate(50);
    setIsDialogOpen(false);
    
    toast({
      title: "Success",
      description: `Project "${newProject.name}" created successfully!`
    });
  };

  const startTimer = (projectId: string) => {
    const now = Date.now();
    setProjects(prev => 
      prev.map(project => {
        if (project.id === projectId) {
          const newSession: TimeSession = {
            id: Date.now().toString(),
            startTime: now,
            duration: 0
          };
          
          return {
            ...project,
            isRunning: true,
            startTime: now,
            sessions: [...project.sessions, newSession]
          };
        }
        // Stop other running projects
        return {
          ...project,
          isRunning: false,
          startTime: undefined
        };
      })
    );

    toast({
      title: "Timer Started",
      description: "Time tracking has begun for this project"
    });
  };

  const stopTimer = (projectId: string) => {
    const now = Date.now();
    setProjects(prev => 
      prev.map(project => {
        if (project.id === projectId && project.isRunning && project.startTime) {
          const sessionDuration = Math.floor((now - project.startTime) / 1000);
          const updatedSessions = [...project.sessions];
          const lastSession = updatedSessions[updatedSessions.length - 1];
          
          if (lastSession) {
            lastSession.endTime = now;
            lastSession.duration = sessionDuration;
          }

          return {
            ...project,
            isRunning: false,
            startTime: undefined,
            totalTime: project.totalTime + sessionDuration,
            sessions: updatedSessions
          };
        }
        return project;
      })
    );

    toast({
      title: "Timer Stopped",
      description: "Time has been recorded for this project"
    });
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateEarnings = (project: Project) => {
    const hours = project.totalTime / 3600;
    return (hours * project.hourlyRate).toFixed(2);
  };

  const getCurrentSessionTime = (project: Project) => {
    if (!project.isRunning || !project.startTime) return 0;
    return Math.floor((Date.now() - project.startTime) / 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mb-4">
            <Clock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">TimeTracker</h1>
          <p className="text-gray-600">Track your freelance projects</p>
        </div>

        {/* Add Project Button */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full mb-6 h-14 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              <Plus className="w-6 h-6 mr-2" />
              Add New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="w-11/12 max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="projectName">Project Name</Label>
                <Input
                  id="projectName"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Enter project name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  value={newProjectRate}
                  onChange={(e) => setNewProjectRate(Number(e.target.value))}
                  placeholder="50"
                  className="mt-1"
                />
              </div>
              <Button onClick={createProject} className="w-full">
                Create Project
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Projects List */}
        <div className="space-y-4">
          {projects.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No projects yet. Create your first project to start tracking time!</p>
              </CardContent>
            </Card>
          ) : (
            projects.map((project) => (
              <Card key={project.id} className="overflow-hidden shadow-lg border-0 bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-gray-900">{project.name}</CardTitle>
                  <div className="flex items-center text-sm text-gray-600">
                    <DollarSign className="w-4 h-4 mr-1" />
                    ${project.hourlyRate}/hour
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Time Display */}
                  <div className="text-center">
                    <div className="text-3xl font-mono font-bold text-gray-900 mb-1">
                      {formatTime(project.totalTime + getCurrentSessionTime(project))}
                    </div>
                    <div className="text-sm text-gray-600">
                      Earnings: ${calculateEarnings({
                        ...project,
                        totalTime: project.totalTime + getCurrentSessionTime(project)
                      })}
                    </div>
                  </div>

                  {/* Control Button */}
                  <div className="flex justify-center">
                    {project.isRunning ? (
                      <Button
                        onClick={() => stopTimer(project.id)}
                        className="w-full h-14 text-lg bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                      >
                        <Square className="w-6 h-6 mr-2" />
                        Stop Timer
                      </Button>
                    ) : (
                      <Button
                        onClick={() => startTimer(project.id)}
                        className="w-full h-14 text-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                      >
                        <Play className="w-6 h-6 mr-2" />
                        Start Timer
                      </Button>
                    )}
                  </div>

                  {/* Session Count */}
                  {project.sessions.length > 0 && (
                    <div className="text-center text-sm text-gray-500">
                      {project.sessions.length} session{project.sessions.length !== 1 ? 's' : ''} recorded
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
