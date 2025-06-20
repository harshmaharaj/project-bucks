
import React, { useState } from 'react';
import { Calendar, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EditSessionModalProps {
  session: any;
  project: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSessionUpdated: () => void;
}

const EditSessionModal = ({ session, project, open, onOpenChange, onSessionUpdated }: EditSessionModalProps) => {
  const [startTime, setStartTime] = useState(() => {
    const date = new Date(session.start_time);
    return date.toISOString().slice(0, 16);
  });
  
  const [endTime, setEndTime] = useState(() => {
    const date = new Date(session.end_time);
    return date.toISOString().slice(0, 16);
  });

  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    try {
      setLoading(true);

      const startTimestamp = new Date(startTime).getTime();
      const endTimestamp = new Date(endTime).getTime();

      if (endTimestamp <= startTimestamp) {
        toast.error('End time must be after start time');
        return;
      }

      const newDuration = Math.floor((endTimestamp - startTimestamp) / 1000);
      const oldDuration = session.duration;
      const durationDiff = newDuration - oldDuration;

      // Update the session
      const { error: sessionError } = await supabase
        .from('time_sessions')
        .update({
          start_time: startTimestamp,
          end_time: endTimestamp,
          duration: newDuration
        })
        .eq('id', session.id);

      if (sessionError) throw sessionError;

      // Update the project's total time
      const { error: projectError } = await supabase
        .from('projects')
        .update({
          total_time: project.total_time + durationDiff
        })
        .eq('id', project.id);

      if (projectError) throw projectError;

      toast.success('Session updated successfully');
      onSessionUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating session:', error);
      toast.error('Failed to update session');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const calculateHours = () => {
    if (!startTime || !endTime) return '0.00';
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    if (end <= start) return '0.00';
    const duration = (end - start) / 1000;
    return (duration / 3600).toFixed(2);
  };

  const calculateEarning = () => {
    const hours = parseFloat(calculateHours());
    return (hours * project.hourly_rate).toFixed(2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Edit Session
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            Session from {formatDate(session.start_time)} - {project.name}
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="start-time">Start Time</Label>
              <Input
                id="start-time"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="end-time">End Time</Label>
              <Input
                id="end-time"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>

            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Duration:</span>
                <span className="font-medium">{calculateHours()}h</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Earning:</span>
                <span className="font-medium">{project.rate_currency} {calculateEarning()}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditSessionModal;
