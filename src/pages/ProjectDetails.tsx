import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useProjects } from '@/hooks/useProjects';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import Navbar from '@/components/Navbar';
import PullToRefresh from '@/components/PullToRefresh';

const ProjectDetails = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { projects, loading, refetchProjects } = useProjects();

  const project = projects.find(p => p.id === projectId);

  // Pull to refresh functionality
  const { isRefreshing, pullDistance } = usePullToRefresh({
    onRefresh: refetchProjects,
    threshold: 80
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navbar />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading project...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navbar />
        <div className="p-4">
          <div className="max-w-4xl mx-auto">
            <Button 
              onClick={() => navigate('/')} 
              variant="ghost" 
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Projects
            </Button>
            <Card className="text-center py-12">
              <CardContent>
                <p className="text-gray-500">Project not found.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <PullToRefresh 
        isRefreshing={isRefreshing} 
        pullDistance={pullDistance} 
        threshold={80} 
      />
      <Navbar />
      
      <div className="p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Button 
              onClick={() => navigate('/')} 
              variant="ghost" 
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Projects
            </Button>
            
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-6 h-6 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
            </div>
            
            <div className="text-gray-600">
              <span className="inline-flex items-center mr-4">
                {project.hourly_rate} {project.rate_currency}/hour
              </span>
              <span>{project.committed_weekly_hours}h/week commitment</span>
            </div>
          </div>

          {/* Project Summary */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Project Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Total Sessions</div>
                  <div className="text-3xl font-bold text-blue-600">{sortedSessions.length}</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Total Hours</div>
                  <div className="text-3xl font-bold text-green-600">{(project.total_time / 3600).toFixed(1)}h</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Total Earnings</div>
                  <div className="text-3xl font-bold text-purple-600 flex items-center justify-center gap-1">
                    {project.rate_currency} {totalEarnings.toFixed(2)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Time Sessions Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Time Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sortedSessions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p>No completed sessions yet. Start tracking time to see session details here.</p>
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetails;
