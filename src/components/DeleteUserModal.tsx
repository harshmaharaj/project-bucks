import React, { useState } from 'react';
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
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DeleteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string;
  onUserDeleted: () => void;
}

const DeleteUserModal: React.FC<DeleteUserModalProps> = ({
  isOpen,
  onClose,
  userId,
  userEmail,
  onUserDeleted,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDeleteUser = async () => {
    try {
      setIsDeleting(true);
      
      const { data, error } = await supabase.rpc('delete_user_and_data', {
        _user_id: userId
      });

      if (error) {
        console.error('Error deleting user:', error);
        toast({
          title: "Error",
          description: "Failed to delete user. Please try again.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "User has been deleted successfully."
      });
      
      onUserDeleted();
      onClose();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete User</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the user <strong>{userEmail}</strong>? 
            This action cannot be undone and will permanently remove all user data including:
            <br />
            <br />
            • User profile and account
            <br />
            • All projects created by this user
            <br />
            • All time tracking sessions
            <br />
            • All associated data
            <br />
            <br />
            The user will be able to register again as a new user if they wish.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteUser}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Deleting...' : 'Delete User'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteUserModal;