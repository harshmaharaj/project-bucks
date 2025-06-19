import React, { useState, useEffect } from 'react';
import { Plus, Play, Square, Clock, DollarSign, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';

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
  sessions: TimeSession[];
}

interface TimeSession {
  id: string;
  start_time: number;
  end_time?: number;
  duration: number;
}

const Index = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectRate, setNewProjectRate] = useState<number>(50);
  const [newProjectCurrency, setNewProjectCurrency] = useState<string>('USD');
  const [newProjectWeeklyHours, setNewProjectWeeklyHours] = useState<number>(40);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const { user, userRole } = useAuth();
  const { toast } = useToast();

  // Fetch projects based on user role
  const fetchProjects = async () => {
    try {
      setLoading(true);
      let query = supabase.from('projects').select(`
        *,
        time_sessions(*)
      `);

      if (userRole === 'super_admin') {
        // Super admin can see all projects with user info
        query = supabase.from('projects').select(`
          *,
          time_sessions(*),
          profiles(email)
        `);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const projectsWithSessions = data?.map((project: any) => ({
        ...project,
        sessions: project.time_sessions || [],
        user_email: project.profiles?.email || 'Unknown'
      })) || [];

      setProjects(projectsWithSessions);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Error",
        description: "Failed to fetch projects",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch all users for super admin
  const fetchAllUsers = async () => {
    if (userRole === 'super_admin') {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setAllUsers(data || []);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    }
  };

  useEffect(() => {
    if (user && userRole) {
      fetchProjects();
      fetchAllUsers();
    }
  }, [user, userRole]);

  // Update running timers every second
  useEffect(() => {
    const interval = setInterval(() => {
      setProjects(prevProjects => 
        prevProjects.map(project => {
          if (project.is_running && project.start_time) {
            const currentTime = Date.now();
            const sessionTime = Math.floor((currentTime - project.start_time) / 1000);
            return {
              ...project,
              total_time: project.total_time + sessionTime - (project.sessions[project.sessions.length - 1]?.duration || 0)
            };
          }
          return project;
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const createProject = async () => {
    if (!newProjectName.trim()) {
      toast({
        title: "Error",
        description: "Project name is required",
        variant: "destructive"
      });
      return;
    }

    if (newProjectRate <= 0 || newProjectWeeklyHours <= 0) {
      toast({
        title: "Error", 
        description: "Hourly rate and weekly hours must be greater than 0",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([{
          name: newProjectName.trim(),
          hourly_rate: newProjectRate,
          rate_currency: newProjectCurrency,
          committed_weekly_hours: newProjectWeeklyHours,
          user_id: user?.id
        }])
        .select()
        .single();

      if (error) throw error;

      setProjects(prev => [{
        ...data,
        sessions: [],
        user_email: user?.email || 'Unknown'
      }, ...prev]);

      setNewProjectName('');
      setNewProjectRate(50);
      setNewProjectCurrency('USD');
      setNewProjectWeeklyHours(40);
      setIsDialogOpen(false);
      
      toast({
        title: "Success",
        description: `Project "${data.name}" created successfully!`
      });
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive"
      });
    }
  };

  const startTimer = async (projectId: string) => {
    try {
      const now = Date.now();
      
      // Stop all other running projects first
      await supabase
        .from('projects')
        .update({ is_running: false, start_time: null })
        .neq('id', projectId);

      // Start the selected project
      const { error: projectError } = await supabase
        .from('projects')
        .update({ 
          is_running: true, 
          start_time: now 
        })
        .eq('id', projectId);

      if (projectError) throw projectError;

      // Create new time session
      const { error: sessionError } = await supabase
        .from('time_sessions')
        .insert([{
          project_id: projectId,
          start_time: now,
          duration: 0
        }]);

      if (sessionError) throw sessionError;

      // Update local state
      setProjects(prev => 
        prev.map(project => ({
          ...project,
          is_running: project.id === projectId,
          start_time: project.id === projectId ? now : undefined
        }))
      );

      toast({
        title: "Timer Started",
        description: "Time tracking has begun for this project"
      });
    } catch (error) {
      console.error('Error starting timer:', error);
      toast({
        title: "Error",
        description: "Failed to start timer",
        variant: "destructive"
      });
    }
  };

  const stopTimer = async (projectId: string) => {
    try {
      const now = Date.now();
      const project = projects.find(p => p.id === projectId);
      
      if (!project || !project.is_running || !project.start_time) return;

      const sessionDuration = Math.floor((now - project.start_time) / 1000);

      // Update project
      const { error: projectError } = await supabase
        .from('projects')
        .update({ 
          is_running: false, 
          start_time: null,
          total_time: project.total_time + sessionDuration
        })
        .eq('id', projectId);

      if (projectError) throw projectError;

      // Update the last session
      const { error: sessionError } = await supabase
        .from('time_sessions')
        .update({
          end_time: now,
          duration: sessionDuration
        })
        .eq('project_id', projectId)
        .is('end_time', null)
        .order('created_at', { ascending: false })
        .limit(1);

      if (sessionError) throw sessionError;

      // Update local state
      setProjects(prev => 
        prev.map(p => 
          p.id === projectId 
            ? { 
                ...p, 
                is_running: false, 
                start_time: undefined, 
                total_time: p.total_time + sessionDuration 
              }
            : p
        )
      );

      toast({
        title: "Timer Stopped",
        description: "Time has been recorded for this project"
      });
    } catch (error) {
      console.error('Error stopping timer:', error);
      toast({
        title: "Error",
        description: "Failed to stop timer",
        variant: "destructive"
      });
    }
  };

  // ... keep existing code (helper functions like formatTime, calculateEarnings, etc.)
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateEarnings = (project: Project) => {
    const hours = project.total_time / 3600;
    return (hours * project.hourly_rate).toFixed(2);
  };

  const getCurrentSessionTime = (project: Project) => {
    if (!project.is_running || !project.start_time) return 0;
    return Math.floor((Date.now() - project.start_time) / 1000);
  };

  const getWeeklyProgress = (project: Project) => {
    const hours = project.total_time / 3600;
    const percentage = (hours / project.committed_weekly_hours) * 100;
    return Math.min(percentage, 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navbar />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading projects...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />
      
      <div className="p-4">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mb-4">
              <Clock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">TimeTracker</h1>
            <p className="text-gray-600">
              {userRole === 'super_admin' ? 'Admin Dashboard - All Projects' : 'Track your freelance projects'}
            </p>
          </div>

          {/* Super Admin Stats */}
          {userRole === 'super_admin' && (
            <Card className="mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg text-orange-800">
                  <Users className="w-5 h-5 mr-2" />
                  Admin Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-orange-600">{allUsers.length}</div>
                    <div className="text-sm text-orange-700">Total Users</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">{projects.length}</div>
                    <div className="text-sm text-orange-700">Total Projects</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Add Project Button - Only for regular users */}
          {userRole !== 'super_admin' && (
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
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="hourlyRate">Hourly Rate</Label>
                      <Input
                        id="hourlyRate"
                        type="number"
                        value={newProjectRate}
                        onChange={(e) => setNewProjectRate(Number(e.target.value))}
                        placeholder="50"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="currency">Currency</Label>
                      <Select value={newProjectCurrency} onValueChange={setNewProjectCurrency}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="USD" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                          <SelectItem value="CAD">CAD</SelectItem>
                          <SelectItem value="AUD">AUD</SelectItem>
                          <SelectItem value="INR">INR</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="weeklyHours">Committed Weekly Hours</Label>
                    <Input
                      id="weeklyHours"
                      type="number"
                      value={newProjectWeeklyHours}
                      onChange={(e) => setNewProjectWeeklyHours(Number(e.target.value))}
                      placeholder="40"
                      className="mt-1"
                    />
                  </div>
                  <Button onClick={createProject} className="w-full">
                    Create Project
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* Projects List */}
          <div className="space-y-4">
            {projects.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {userRole === 'super_admin' 
                      ? 'No projects found across all users.' 
                      : 'No projects yet. Create your first project to start tracking time!'
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              projects.map((project) => (
                <Card key={project.id} className="overflow-hidden shadow-lg border-0 bg-white">
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
                        <span>{((project.total_time + getCurrentSessionTime(project)) / 3600).toFixed(1)}h / {project.committed_weekly_hours}h</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${getWeeklyProgress(project)}%` }}
                        ></div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Time Display */}
                    <div className="text-center">
                      <div className="text-3xl font-mono font-bold text-gray-900 mb-1">
                        {formatTime(project.total_time + getCurrentSessionTime(project))}
                      </div>
                      <div className="text-sm text-gray-600">
                        Earnings: {project.rate_currency} {calculateEarnings({
                          ...project,
                          total_time: project.total_time + getCurrentSessionTime(project)
                        })}
                      </div>
                    </div>

                    {/* Control Button - Only for project owner or if it's the user's own project */}
                    {(userRole !== 'super_admin' && project.user_id === user?.id) && (
                      <div className="flex justify-center">
                        {project.is_running ? (
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
                    )}

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
    </div>
  );
};

export default Index;
