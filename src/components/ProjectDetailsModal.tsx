import React from 'react';
import { Calendar, Clock, DollarSign } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatTime } from '@/utils/timeUtils';

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

interface ProjectDetailsModalProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProjectDetailsModal = ({ project, open, onOpenChange }: ProjectDetailsModalProps) => {
  if (!project) return null;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const formatTimeOnly = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const calculateSessionHours = (duration: number) => {
    return (duration / 3600).toFixed(2);
  };

  const calculateSessionEarning = (duration: number) => {
    const hours = duration / 3600;
    return (hours * project.hourly_rate).toFixed(2);
  };

  // Filter out sessions that don't have an end_time (currently running sessions)
  const completedSessions = project.sessions.filter(session => session.end_time);

  // Sort sessions by start time (most recent first)
  const sortedSessions = completedSessions.sort((a, b) => b.start_time - a.start_time);

  const totalEarnings = sortedSessions.reduce((total, session) => {
    const hours = session.duration / 3600;
    return total + (hours * project.hourly_rate);
  }, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {project.name} - Time Tracking Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Project Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-sm text-gray-600">Total Sessions</div>
              <div className="text-2xl font-bold">{sortedSessions.length}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Total Hours</div>
              <div className="text-2xl font-bold">{(project.total_time / 3600).toFixed(1)}h</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600">Total Earnings</div>
              <div className="text-2xl font-bold flex items-center justify-center gap-1">
                {project.rate_currency} {totalEarnings.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Sessions Table */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Time Sessions
            </h3>
            
            {sortedSessions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No completed sessions yet. Start tracking time to see session details here.
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Start Time</TableHead>
                      <TableHead>Stop Time</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Earning</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedSessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell className="font-medium">
                          {formatDate(session.start_time)}
                        </TableCell>
                        <TableCell>
                          {formatTimeOnly(session.start_time)}
                        </TableCell>
                        <TableCell>
                          {session.end_time ? formatTimeOnly(session.end_time) : 'Running...'}
                        </TableCell>
                        <TableCell>
                          {calculateSessionHours(session.duration)}h
                        </TableCell>
                        <TableCell className="flex items-center gap-1">
                          {project.rate_currency} {calculateSessionEarning(session.duration)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectDetailsModal;
