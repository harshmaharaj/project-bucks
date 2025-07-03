
import React from 'react';
import { LogOut, User, Crown, Users, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import ProjectForm from '@/components/ProjectForm';

interface NavbarProps {
  onProjectCreated?: (project: any) => void;
  showBackButton?: boolean;
  onBackClick?: () => void;
}

const Navbar = ({ onProjectCreated, showBackButton, onBackClick }: NavbarProps) => {
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

  const getUserInitials = () => {
    if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b px-4 py-3">
      <div className="max-w-md mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Back Button */}
          {showBackButton && (
            <Button
              onClick={onBackClick}
              variant="ghost"
              size="sm"
              className="text-xs"
            >
              ← Back to Projects
            </Button>
          )}
          {/* Add Project Button - Only for regular users */}
          {userRole !== 'super_admin' && onProjectCreated && (
            <ProjectForm onProjectCreated={onProjectCreated} />
          )}
          
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
          {/* User Profile Drawer */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="p-1 rounded-full">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-sm font-medium">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>User Profile</SheetTitle>
                <SheetDescription>
                  Manage your account settings and preferences
                </SheetDescription>
              </SheetHeader>
              
              <div className="flex flex-col space-y-6 mt-6">
                {/* User Info */}
                <div className="flex items-center space-x-4">
                  <Avatar className="w-16 h-16">
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-xl font-medium">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium text-gray-900">{user.email}</h3>
                    <p className="text-sm text-gray-500 capitalize">
                      {userRole === 'super_admin' ? 'Super Admin' : 'User'}
                    </p>
                  </div>
                </div>

                {/* User Details */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <p className="text-sm text-gray-900 mt-1">{user.email}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">User ID</label>
                    <p className="text-sm text-gray-500 mt-1 font-mono break-all">{user.id}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Role</label>
                    <p className="text-sm text-gray-900 mt-1 capitalize">
                      {userRole === 'super_admin' ? 'Super Admin' : 'User'}
                    </p>
                  </div>
                </div>

                {/* Logout Button */}
                <div className="pt-4 border-t">
                  <Button
                    onClick={handleSignOut}
                    variant="outline"
                    size="sm"
                    className="w-full flex items-center justify-center space-x-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
