
import React, { useState, useEffect } from 'react';
import { Users as UsersIcon, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  role: 'super_admin' | 'user';
}

const Users = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { userRole } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Redirect if not super admin
  useEffect(() => {
    if (userRole && userRole !== 'super_admin') {
      navigate('/');
      return;
    }
  }, [userRole, navigate]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // First, fetch all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      // Then, fetch all user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) {
        console.error('Error fetching roles:', rolesError);
        throw rolesError;
      }

      // Combine profiles with roles
      const usersWithRoles = profilesData?.map((profile: any) => {
        const userRole = rolesData?.find((role: any) => role.user_id === profile.id);
        return {
          ...profile,
          role: userRole?.role || 'user'
        };
      }) || [];

      console.log('Fetched users with roles:', usersWithRoles);
      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userRole === 'super_admin') {
      fetchUsers();
    }
  }, [userRole]);

  const handleUserClick = (userId: string, userEmail: string) => {
    navigate(`/user/${userId}`, { state: { userEmail } });
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
            <p className="mt-4 text-gray-600">Loading users...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Navbar />
      
      <div className="p-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full mb-4">
              <UsersIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
            <p className="text-gray-600">Tap on any user to view their projects</p>
          </div>

          {/* Users List */}
          <div className="space-y-3">
            {users.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No users found.</p>
                </CardContent>
              </Card>
            ) : (
              users.map((user) => (
                <Card 
                  key={user.id} 
                  className="cursor-pointer hover:shadow-lg transition-shadow duration-200 border-0 bg-white"
                  onClick={() => handleUserClick(user.id, user.email)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {user.full_name || 'Unnamed User'}
                        </h3>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">
                          Click to view projects
                        </div>
                      </div>
                    </div>
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

export default Users;
