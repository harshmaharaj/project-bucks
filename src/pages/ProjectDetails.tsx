import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, MoreVertical, Edit, Trash2, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useProjects } from '@/hooks/useProjects';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import Navbar from '@/components/Navbar';
import PullToRefresh from '@/components/PullToRefresh';
import EditSessionModal from '@/components/EditSessionModal';
import DeleteSessionModal from '@/components/DeleteSessionModal';
const ProjectDetails = () => {
  const {
    projectId
  } = useParams();
  const navigate = useNavigate();
  const {
    projects,
    loading,
    refetchProjects
  } = useProjects();
  const [editingSession, setEditingSession] = useState(null);
  const [deletingSession, setDeletingSession] = useState(null);
  const [chartStartIndex, setChartStartIndex] = useState(0);
  const project = projects.find(p => p.id === projectId);

  // Filter out sessions that don't have an end_time (currently running sessions)
  const completedSessions = project?.sessions.filter(session => session.end_time) || [];

  // Sort sessions by start time (most recent first)  
  const sortedSessions = completedSessions.sort((a, b) => b.start_time - a.start_time);
  const totalEarnings = sortedSessions.reduce((total, session) => {
    const hours = session.duration / 3600;
    return total + hours * (project?.hourly_rate || 0);
  }, 0);

  // Prepare daily analytics data for the whole year
  const {
    allYearData,
    currentWeekData
  } = useMemo(() => {
    if (!project) return {
      allYearData: [],
      currentWeekData: []
    };

    // Create a full year of dates (365 days)
    const today = new Date();
    const yearAgo = new Date(today);
    yearAgo.setFullYear(today.getFullYear() - 1);
    const dailyData: {
      [key: string]: number;
    } = {};

    // Initialize all days in the year with 0 earnings
    for (let d = new Date(yearAgo); d <= today; d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0];
      dailyData[dateKey] = 0;
    }

    // Add actual session data
    completedSessions.forEach(session => {
      const date = new Date(session.start_time);
      const dateKey = date.toISOString().split('T')[0];
      const hours = session.duration / 3600;
      if (dailyData.hasOwnProperty(dateKey)) {
        dailyData[dateKey] += hours;
      }
    });

    // Convert to array and sort by date
    const allData = Object.entries(dailyData).map(([dateKey, hours]) => {
      const date = new Date(dateKey);
      const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
      const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      return {
        date: dateKey,
        day: dayNames[date.getDay()],
        displayDate: `${monthNames[date.getMonth()]} ${date.getDate()}`,
        hours: Number(hours.toFixed(2)),
        earnings: Number((hours * project.hourly_rate).toFixed(2))
      };
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Get current week data (7 days starting from chartStartIndex)
    const startIndex = Math.max(0, Math.min(chartStartIndex, allData.length - 7));
    const weekData = allData.slice(startIndex, startIndex + 7);

    // Find the highest earning day in current week
    const maxEarnings = Math.max(...weekData.map(d => d.earnings));
    const weekDataWithHighlight = weekData.map(data => ({
      ...data,
      isHighest: data.earnings === maxEarnings && data.earnings > 0
    }));
    return {
      allYearData: allData,
      currentWeekData: weekDataWithHighlight
    };
  }, [completedSessions, project?.hourly_rate, chartStartIndex]);

  // Initialize chart to show the most recent week with data
  React.useEffect(() => {
    if (allYearData.length > 0 && chartStartIndex === 0) {
      // Find the last day with earnings
      const lastDataIndex = allYearData.map(d => d.earnings).lastIndexOf(Math.max(...allYearData.map(d => d.earnings)));
      if (lastDataIndex >= 0) {
        const newStartIndex = Math.max(0, lastDataIndex - 6);
        setChartStartIndex(newStartIndex);
      }
    }
  }, [allYearData, chartStartIndex]);
  const canGoLeft = chartStartIndex > 0;
  const canGoRight = chartStartIndex < allYearData.length - 7;

  // Pull to refresh functionality
  const {
    isRefreshing,
    pullDistance
  } = usePullToRefresh({
    onRefresh: refetchProjects,
    threshold: 80
  });
  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navbar />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading project...</p>
          </div>
        </div>
      </div>;
  }
  if (!project) {
    return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navbar />
        <div className="p-4">
          <div className="max-w-4xl mx-auto">
            <Button onClick={() => navigate('/')} variant="ghost" className="mb-4">
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
      </div>;
  }
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };
  const formatTimeOnly = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  const calculateSessionHours = (duration: number) => {
    return (duration / 3600).toFixed(2);
  };
  const calculateSessionEarning = (duration: number) => {
    const hours = duration / 3600;
    return (hours * project.hourly_rate).toFixed(2);
  };
  const handleEditSession = session => {
    console.log('Opening edit modal for session:', session.id);
    setEditingSession(session);
  };
  const handleDeleteSession = session => {
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
  return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <PullToRefresh isRefreshing={isRefreshing} pullDistance={pullDistance} threshold={80} />
      <Navbar />
      
      <div className="p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Button onClick={() => navigate('/')} variant="ghost" className="mb-4">
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
                  <div className="space-y-6">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Weekly Earnings Overview</h3>
                      <p className="text-sm text-gray-600">Track your daily earnings and work patterns</p>
                    </div>
                    
                    {currentWeekData.length === 0 ? <div className="text-center py-12 text-gray-500">
                        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p>No data available for analytics. Complete some work sessions to see your daily patterns.</p>
                      </div> : <div className="bg-gray-50 rounded-lg p-6 py-[8px] px-0 mx-0">
                        {/* Navigation Controls */}
                        <div className="flex items-center justify-between mb-4">
                          <Button variant="outline" size="sm" onClick={() => setChartStartIndex(Math.max(0, chartStartIndex - 7))} disabled={!canGoLeft} className="flex items-center gap-2">
                            <ChevronLeft className="w-4 h-4" />
                            Previous Week
                          </Button>
                          
                          <div className="text-sm text-gray-600">
                            {currentWeekData.length > 0 && <>
                                {currentWeekData[0].displayDate} - {currentWeekData[currentWeekData.length - 1].displayDate}
                              </>}
                          </div>
                          
                          <Button variant="outline" size="sm" onClick={() => setChartStartIndex(Math.min(allYearData.length - 7, chartStartIndex + 7))} disabled={!canGoRight} className="flex items-center gap-2">
                            Next Week
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <div className="h-80 relative">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={currentWeekData} margin={{
                          top: 40,
                          right: 30,
                          left: 20,
                          bottom: 20
                        }} barCategoryGap="20%">
                              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{
                            fontSize: 14,
                            fill: '#6B7280',
                            fontWeight: 500
                          }} />
                              <YAxis hide />
                              <Tooltip cursor={false} content={({
                            active,
                            payload,
                            label
                          }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                                        <div className="text-xs text-gray-500 mb-1">{data.displayDate}</div>
                                        <div className="text-lg font-bold text-gray-900">
                                          {project.rate_currency} {data.earnings.toFixed(2)}
                                        </div>
                                        <div className="text-xs text-gray-600">
                                          {data.hours}h worked
                                        </div>
                                      </div>;
                            }
                            return null;
                          }} />
                              <Bar dataKey="earnings" radius={[8, 8, 0, 0]} maxBarSize={40}>
                                {currentWeekData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.isHighest ? '#059669' : '#A7F3D0'} />)}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        
                        {/* Stats below chart */}
                        <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-200">
                          <div className="text-center">
                            <div className="text-xs text-gray-500 mb-1">Total This Week</div>
                            <div className="text-xl font-bold text-gray-900">
                              {project.rate_currency} {currentWeekData.reduce((sum, day) => sum + day.earnings, 0).toFixed(2)}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-gray-500 mb-1">Best Day</div>
                            <div className="text-xl font-bold text-green-600">
                              {project.rate_currency} {Math.max(...currentWeekData.map(d => d.earnings)).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>}
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
              {sortedSessions.length === 0 ? <div className="text-center py-12 text-gray-500">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p>No completed sessions yet. Start tracking time to see session details here.</p>
                </div> : <div className="border rounded-lg overflow-hidden">
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
                      {sortedSessions.map(session => <TableRow key={session.id}>
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
                                <DropdownMenuItem onClick={() => handleEditSession(session)} className="flex items-center gap-2 cursor-pointer">
                                  <Edit className="h-4 w-4" />
                                  Edit Session
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteSession(session)} className="flex items-center gap-2 cursor-pointer text-red-600">
                                  <Trash2 className="h-4 w-4" />
                                  Delete Session
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>)}
                    </TableBody>
                  </Table>
                </div>}
            </CardContent>
          </Card>
        </div>
      </div>

      {editingSession && <EditSessionModal session={editingSession} project={project} open={!!editingSession} onOpenChange={open => !open && setEditingSession(null)} onSessionUpdated={handleSessionUpdated} />}

      {deletingSession && <DeleteSessionModal session={deletingSession} project={project} open={!!deletingSession} onOpenChange={open => !open && setDeletingSession(null)} onSessionDeleted={handleSessionDeleted} />}
    </div>;
};
export default ProjectDetails;