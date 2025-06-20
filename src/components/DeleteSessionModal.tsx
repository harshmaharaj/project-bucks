
import React, { useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface DeleteSessionModalProps {
  session: any;
  project: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSessionDeleted: () => void;
}

const DeleteSessionModal = ({ session, project, open, onOpenChange, onSessionDeleted }: DeleteSessionModalProps) => {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    try {
      setLoading(true);
      console.log('Deleting session:', session.id, 'for project:', project.id);

      // Calculate the new total time after removing this session
      const newTotalTime = Math.max(0, project.total_time - session.duration);
      console.log('Current total time:', project.total_time, 'Session duration:', session.duration, 'New total:', newTotalTime);

      // Delete the session first
      const { error: sessionError } = await supabase
        .from('time_sessions')
        .delete()
        .eq('id', session.id);

      if (sessionError) {
        console.error('Session delete error:', sessionError);
        throw sessionError;
      }

      console.log('Session deleted successfully, updating project total time');

      // Update the project's total time
      const { error: projectError } = await supabase
        .from('projects')
        .update({
          total_time: newTotalTime
        })
        .eq('id', project.id);

      if (projectError) {
        console.error('Project update error:', projectError);
        throw projectError;
      }

      console.log('Project total time updated successfully');
      toast.success('Session deleted successfully');
      onSessionDeleted();
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Failed to delete session');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const calculateHours = (duration: number) => {
    return (duration / 3600).toFixed(2);
  };

  const calculateEarning = (duration: number) => {
    const hours = duration / 3600;
    return (hours * project.hourly_rate).toFixed(2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="w-5 h-5" />
            Delete Session
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <div className="text-sm text-red-700">
              This action cannot be undone. The session data will be permanently deleted.
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg space-y-2">
            <div className="font-medium text-sm text-gray-900">Session Details</div>
            <div className="space-y-1 text-sm text-gray-600">
              <div>Date: {formatDate(session.start_time)}</div>
              <div>Time: {formatTime(session.start_time)} - {formatTime(session.end_time)}</div>
              <div>Duration: {calculateHours(session.duration)}h</div>
              <div>Earning: {project.rate_currency} {calculateEarning(session.duration)}</div>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Deleting...' : 'Delete Session'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteSessionModal;
