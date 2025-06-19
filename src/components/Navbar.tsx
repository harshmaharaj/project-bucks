
import React from 'react';
import { LogOut, User, Crown, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const { user, userRole, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Success",
        description: "Logged out successfully!"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive"
      });
    }
  };

  if (!user) return null;

  return (
    <div className="bg-white shadow-sm border-b px-4 py-3">
      <div className="max-w-md mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            {userRole === 'super_admin' ? (
              <Crown className="w-4 h-4 text-yellow-500" />
            ) : (
              <User className="w-4 h-4 text-gray-500" />
            )}
            <span className="text-sm font-medium text-gray-700">
              {userRole === 'super_admin' ? 'Super Admin' : 'User'}
            </span>
          </div>
          
          {/* Super Admin Navigation */}
          {userRole === 'super_admin' && (
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => navigate('/')}
                variant="ghost"
                size="sm"
                className="text-xs"
              >
                Dashboard
              </Button>
              <Button
                onClick={() => navigate('/users')}
                variant="ghost"
                size="sm"
                className="text-xs flex items-center space-x-1"
              >
                <Users className="w-3 h-3" />
                <span>Users</span>
              </Button>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-600 hidden sm:inline">
            {user.email}
          </span>
          <Button
            onClick={handleSignOut}
            variant="outline"
            size="sm"
            className="flex items-center space-x-1"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
