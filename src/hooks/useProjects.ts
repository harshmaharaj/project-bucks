import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, userRole } = useAuth();
  const { toast } = useToast();

  const fetchProjects = async () => {
    try {
      setLoading(true);
      let query = supabase.from('projects').select(`
        *,
        time_sessions(*)
      `);

      if (userRole === 'super_admin') {
        query = supabase.from('projects').select(`
          *,
          time_sessions(*),
          profiles(email)
        `);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

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

  const startTimer = async (projectId: string) => {
    try {
      const now = Date.now();
      
      await supabase
        .from('projects')
        .update({ is_running: false, start_time: null })
        .neq('id', projectId);

      const { error: projectError } = await supabase
        .from('projects')
        .update({ 
          is_running: true, 
          start_time: now 
        })
        .eq('id', projectId);

      if (projectError) throw projectError;

      const { error: sessionError } = await supabase
        .from('time_sessions')
        .insert([{
          project_id: projectId,
          start_time: now,
          duration: 0
        }]);

      if (sessionError) throw sessionError;

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

      const { error: projectError } = await supabase
        .from('projects')
        .update({ 
          is_running: false, 
          start_time: null,
          total_time: project.total_time + sessionDuration
        })
        .eq('id', projectId);

      if (projectError) throw projectError;

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

  const deleteProject = async (projectId: string) => {
    try {
      // First delete all time sessions for this project
      const { error: sessionsError } = await supabase
        .from('time_sessions')
        .delete()
        .eq('project_id', projectId);

      if (sessionsError) throw sessionsError;

      // Then delete the project
      const { error: projectError } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (projectError) throw projectError;

      // Update local state
      setProjects(prev => prev.filter(p => p.id !== projectId));

      toast({
        title: "Project Deleted",
        description: "Project and all associated time sessions have been deleted"
      });
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive"
      });
    }
  };

  const resetWeek = async (projectId: string) => {
    try {
      // Calculate the start of the current week (Monday)
      const now = new Date();
      const currentDay = now.getDay();
      const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - daysToMonday);
      weekStart.setHours(0, 0, 0, 0);

      const weekStartTimestamp = weekStart.getTime();

      // Delete all time sessions for this week
      const { error: sessionsError } = await supabase
        .from('time_sessions')
        .delete()
        .eq('project_id', projectId)
        .gte('start_time', weekStartTimestamp);

      if (sessionsError) throw sessionsError;

      // Fetch updated project data
      await fetchProjects();

      toast({
        title: "Week Reset",
        description: "This week's time sessions have been cleared"
      });
    } catch (error) {
      console.error('Error resetting week:', error);
      toast({
        title: "Error",
        description: "Failed to reset week",
        variant: "destructive"
      });
    }
  };

  const viewProject = (project: Project) => {
    // For now, just show a toast with project details
    // This can be expanded to show a detailed view modal
    toast({
      title: project.name,
      description: `${project.sessions.length} sessions • ${(project.total_time / 3600).toFixed(1)} hours total • ${project.rate_currency} ${((project.total_time / 3600) * project.hourly_rate).toFixed(2)} earned`
    });
  };

  const addProject = (newProject: Project) => {
    setProjects(prev => [newProject, ...prev]);
  };

  useEffect(() => {
    if (user && userRole) {
      fetchProjects();
    }
  }, [user, userRole]);

  return {
    projects,
    loading,
    startTimer,
    stopTimer,
    addProject,
    fetchProjects,
    deleteProject,
    resetWeek,
    viewProject
  };
};
