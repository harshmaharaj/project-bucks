import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import AdminStats from '@/components/AdminStats';
import ProjectCard from '@/components/ProjectCard';
import PullToRefresh from '@/components/PullToRefresh';
import EarningsDonutChart from '@/components/EarningsDonutChart';
import { useProjects } from '@/hooks/useProjects';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
const Index = () => {
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const {
    user,
    userRole
  } = useAuth();
  const {
    projects,
    loading,
    startTimer,
    stopTimer,
    addProject,
    deleteProject,
    refetchProjects,
    updateProject
  } = useProjects();

  // Pull to refresh functionality
  const handleRefresh = async () => {
    await refetchProjects();
    if (userRole === 'super_admin') {
      await fetchAllUsers();
    }
  };
  const {
    isRefreshing,
    pullDistance
  } = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 80
  });

  // Fetch all users for super admin
  const fetchAllUsers = async () => {
    if (userRole === 'super_admin') {
      try {
        const {
          data,
          error
        } = await supabase.from('profiles').select('*').order('created_at', {
          ascending: false
        });
        if (error) throw error;
        setAllUsers(data || []);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    }
  };
  
  // Calculate daily workload based on committed weekly hours
  const calculateDailyWorkload = () => {
    const totalWeeklyHours = projects.reduce((sum, project) => sum + project.committed_weekly_hours, 0);
    const totalMonthlyHours = totalWeeklyHours * 4.33; // Average weeks per month
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const dailyHours = totalMonthlyHours / daysInMonth;
    return dailyHours.toFixed(1);
  };
  
  useEffect(() => {
    if (user && userRole) {
      fetchAllUsers();
    }
  }, [user, userRole]);
  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navbar onProjectCreated={addProject} />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading projects...</p>
          </div>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <PullToRefresh isRefreshing={isRefreshing} pullDistance={pullDistance} threshold={80} />
      <Navbar onProjectCreated={addProject} />
      
      <div className="p-4 pt-20">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Project Bucks</h1>
            {/* Daily Workload - Only for regular users */}
            {userRole !== 'super_admin' && projects.length > 0 && (
              <p className="text-lg font-medium text-blue-600">
                Daily Workload: {calculateDailyWorkload()}hrs
              </p>
            )}
          </div>

          {/* Earnings Chart - Only for regular users */}
          {userRole !== 'super_admin' && projects.length > 0 && <div className="mb-6">
              <EarningsDonutChart projects={projects} />
            </div>}

          {/* Super Admin Stats */}
          {userRole === 'super_admin' && <AdminStats totalUsers={allUsers.length} totalProjects={projects.length} />}

          {/* Projects List */}
          <div className="space-y-4">
            {projects.length === 0 ? <Card className="text-center py-12">
                <CardContent>
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {userRole === 'super_admin' ? 'No projects found across all users.' : 'No projects yet. Create your first project to start tracking time!'}
                  </p>
                </CardContent>
              </Card> : projects.map(project => <ProjectCard key={project.id} project={project} userRole={userRole} currentUserId={user?.id} onStartTimer={startTimer} onStopTimer={stopTimer} onDeleteProject={deleteProject} onProjectUpdated={updateProject} />)}
          </div>
        </div>
      </div>
    </div>;
};
export default Index;