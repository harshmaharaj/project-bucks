
import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, DollarSign, User, Crown, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import ProjectDetailsModal from '@/components/ProjectDetailsModal';

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

const UserProjects = () => {
  const { userId } = useParams<{ userId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const { toast } = useToast();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const userEmail = location.state?.userEmail || 'Unknown User';

  // Redirect if not super admin
  useEffect(() => {
    if (userRole && userRole !== 'super_admin') {
      navigate('/');
      return;
    }
  }, [userRole, navigate]);

  const fetchUserProjects = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      
      // First fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      // Then fetch time sessions separately to avoid relationship ambiguity
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('time_sessions')
        .select('*')
        .in('project_id', projectsData?.map(p => p.id) || [])
        .order('start_time', { ascending: false });

      if (sessionsError) throw sessionsError;

      console.log('Fetched projects:', projectsData);
      console.log('Fetched sessions:', sessionsData);

      // Combine the data
      const projectsWithSessions = projectsData?.map((project: any) => ({
        ...project,
        user_email: userEmail,
        sessions: sessionsData?.filter(session => session.project_id === project.id) || []
      })) || [];

      setProjects(projectsWithSessions);
    } catch (error) {
      console.error('Error fetching user projects:', error);
      toast({
        title: "Error",
        description: "Failed to fetch user projects",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userRole === 'super_admin' && userId) {
      fetchUserProjects();
    }
  }, [userRole, userId]);

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

  const handleViewDetails = (project: Project) => {
    console.log('Opening details for project:', project);
    setSelectedProject(project);
    setDetailsModalOpen(true);
  };

  if (userRole !== 'super_admin') {
    return null;
  }

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
          {/* Header with Back Button */}
          <div className="mb-6">
            <Button
              onClick={() => navigate('/users')}
              variant="outline"
              size="sm"
              className="mb-4 flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Users</span>
            </Button>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mb-4">
                <User className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">User Projects</h1>
              <p className="text-gray-600">{userEmail}</p>
              <div className="text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded-full inline-block mt-2">
                <Crown className="w-3 h-3 inline mr-1" />
                Admin View - Read Only
              </div>
            </div>
          </div>

          {/* Projects List */}
          <div className="space-y-4">
            {projects.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">This user has no projects yet.</p>
                </CardContent>
              </Card>
            ) : (
              projects.map((project) => (
                <Card key={project.id} className="overflow-hidden shadow-lg border-0 bg-white">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg font-semibold text-gray-900">{project.name}</CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(project)}
                        className="flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Details
                      </Button>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-1" />
                        {project.hourly_rate} {project.rate_currency}/hour
                      </div>
                      <div className="text-xs">
                        {project.committed_weekly_hours}h/week
                      </div>
                    </div>
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
                      {project.is_running && (
                        <div className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full inline-block mt-2">
                          ● Timer Running
                        </div>
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

      {/* Project Details Modal */}
      <ProjectDetailsModal
        project={selectedProject}
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
      />
    </div>
  );
};

export default UserProjects;
