
import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import AdminStats from '@/components/AdminStats';
import ProjectForm from '@/components/ProjectForm';
import ProjectCard from '@/components/ProjectCard';
import { useProjects } from '@/hooks/useProjects';

const Index = () => {
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const { user, userRole } = useAuth();
  const { projects, loading, startTimer, stopTimer, addProject } = useProjects();

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
      fetchAllUsers();
    }
  }, [user, userRole]);

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
            <AdminStats totalUsers={allUsers.length} totalProjects={projects.length} />
          )}

          {/* Add Project Button - Only for regular users */}
          {userRole !== 'super_admin' && (
            <ProjectForm onProjectCreated={addProject} />
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
                <ProjectCard
                  key={project.id}
                  project={project}
                  userRole={userRole}
                  currentUserId={user?.id}
                  onStartTimer={startTimer}
                  onStopTimer={stopTimer}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
