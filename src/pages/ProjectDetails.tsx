
import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, MoreVertical, Edit, Trash2, BarChart3 } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useProjects } from '@/hooks/useProjects';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import Navbar from '@/components/Navbar';
import PullToRefresh from '@/components/PullToRefresh';
import EditSessionModal from '@/components/EditSessionModal';
import DeleteSessionModal from '@/components/DeleteSessionModal';

const ProjectDetails = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { projects, loading, refetchProjects } = useProjects();
  const [editingSession, setEditingSession] = useState(null);
  const [deletingSession, setDeletingSession] = useState(null);

  const project = projects.find(p => p.id === projectId);

  // Filter out sessions that don't have an end_time (currently running sessions)
  const completedSessions = project?.sessions.filter(session => session.end_time) || [];

  // Sort sessions by start time (most recent first)  
  const sortedSessions = completedSessions.sort((a, b) => b.start_time - a.start_time);

  const totalEarnings = sortedSessions.reduce((total, session) => {
    const hours = session.duration / 3600;
    return total + (hours * (project?.hourly_rate || 0));
  }, 0);

  // Prepare daily analytics data
  const dailyAnalytics = useMemo(() => {
    if (!project) return [];
    
    const dailyData: { [key: string]: number } = {};
    
    completedSessions.forEach(session => {
      const date = new Date(session.start_time).toLocaleDateString();
      const hours = session.duration / 3600;
      
      if (dailyData[date]) {
        dailyData[date] += hours;
      } else {
        dailyData[date] = hours;
      }
    });

    // Convert to array and sort by date
    return Object.entries(dailyData)
      .map(([date, hours]) => ({
        date,
        hours: Number(hours.toFixed(2)),
        earnings: Number((hours * project.hourly_rate).toFixed(2))
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-14); // Show last 14 days
  }, [completedSessions, project?.hourly_rate]);

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

  const handleEditSession = (session) => {
    console.log('Opening edit modal for session:', session.id);
    setEditingSession(session);
  };

  const handleDeleteSession = (session) => {
    console.log('Opening delete modal for session:', session.id);
    setDeletingSession(session);
  };

  const handleSessionUpdated = async () => {
    console.log('Session updated, refreshing project data');
    await refetchProjects();
    setEditingSession(null);
  };

  const handleSessionDeleted = async () => {
    console.log('Session deleted, refreshing project data');
    await refetchProjects();
    setDeletingSession(null);
  };

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

          {/* Project Summary with Tabs */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Project Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="summary" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="summary" className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Summary
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Analytics
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="summary" className="mt-6">
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
                </TabsContent>
                
                <TabsContent value="analytics" className="mt-6">
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Daily Work Hours (Last 14 Days)</h3>
                      <p className="text-sm text-gray-600">Track your daily productivity and work patterns</p>
                    </div>
                    
                    {dailyAnalytics.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p>No data available for analytics. Complete some work sessions to see your daily patterns.</p>
                      </div>
                    ) : (
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={dailyAnalytics}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="date" 
                              tick={{ fontSize: 12 }}
                              angle={-45}
                              textAnchor="end"
                              height={60}
                            />
                            <YAxis 
                              tick={{ fontSize: 12 }}
                              label={{ value: 'Hours', angle: -90, position: 'insideLeft' }}
                            />
                            <Tooltip 
                              formatter={(value, name) => {
                                if (name === 'hours') return [`${value}h`, 'Hours Worked'];
                                return [`${project.rate_currency} ${value}`, 'Earnings'];
                              }}
                              labelFormatter={(label) => `Date: ${label}`}
                            />
                            <Bar 
                              dataKey="hours" 
                              fill="hsl(var(--primary))" 
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                    
                    {dailyAnalytics.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                        <div className="text-center p-4 bg-indigo-50 rounded-lg">
                          <div className="text-sm text-gray-600 mb-1">Average Daily Hours</div>
                          <div className="text-2xl font-bold text-indigo-600">
                            {(dailyAnalytics.reduce((sum, day) => sum + day.hours, 0) / dailyAnalytics.length).toFixed(1)}h
                          </div>
                        </div>
                        <div className="text-center p-4 bg-orange-50 rounded-lg">
                          <div className="text-sm text-gray-600 mb-1">Most Productive Day</div>
                          <div className="text-2xl font-bold text-orange-600">
                            {dailyAnalytics.reduce((max, day) => day.hours > max.hours ? day : max, dailyAnalytics[0])?.hours.toFixed(1)}h
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
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
                        <TableHead className="w-12"></TableHead>
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
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-white">
                                <DropdownMenuItem
                                  onClick={() => handleEditSession(session)}
                                  className="flex items-center gap-2 cursor-pointer"
                                >
                                  <Edit className="h-4 w-4" />
                                  Edit Session
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteSession(session)}
                                  className="flex items-center gap-2 cursor-pointer text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Delete Session
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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

      {editingSession && (
        <EditSessionModal
          session={editingSession}
          project={project}
          open={!!editingSession}
          onOpenChange={(open) => !open && setEditingSession(null)}
          onSessionUpdated={handleSessionUpdated}
        />
      )}

      {deletingSession && (
        <DeleteSessionModal
          session={deletingSession}
          project={project}
          open={!!deletingSession}
          onOpenChange={(open) => !open && setDeletingSession(null)}
          onSessionDeleted={handleSessionDeleted}
        />
      )}
    </div>
  );
};

export default ProjectDetails;
