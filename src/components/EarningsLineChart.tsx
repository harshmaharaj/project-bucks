
import React from 'react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Legend } from 'recharts';
import { formatTime, calculateEarnings } from '@/utils/timeUtils';

interface Project {
  id: string;
  name: string;
  hourly_rate: number;
  rate_currency: string;
  total_time: number;
  sessions: any[];
}

interface EarningsLineChartProps {
  projects: Project[];
}

const EarningsLineChart = ({ projects }: EarningsLineChartProps) => {
  // Generate colors for different projects
  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', 
    '#06B6D4', '#F97316', '#84CC16', '#EC4899', '#6366F1'
  ];

  // Generate chart data for the last 7 days
  const generateChartData = () => {
    const data = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const dayData: any = { date: dateStr };
      
      projects.forEach(project => {
        let dayEarnings = 0;
        
        if (project.sessions) {
          project.sessions.forEach(session => {
            if (session.start_time) {
              const sessionDate = new Date(session.start_time);
              if (sessionDate.toDateString() === date.toDateString()) {
                const sessionHours = session.duration / 3600;
                dayEarnings += sessionHours * project.hourly_rate;
              }
            }
          });
        }
        
        dayData[project.id] = parseFloat(dayEarnings.toFixed(2));
      });
      
      data.push(dayData);
    }
    
    return data;
  };

  const chartData = generateChartData();
  const totalEarnings = projects.reduce((sum, project) => {
    const earnings = parseFloat(calculateEarnings(project.total_time, project.hourly_rate));
    return sum + earnings;
  }, 0);
  
  const currency = projects.length > 0 ? projects[0].rate_currency : 'USD';

  const chartConfig = projects.reduce((config, project, index) => {
    config[project.id] = {
      label: project.name,
    };
    return config;
  }, {} as any);

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Total Earnings</h3>
        <p className="text-2xl font-bold text-blue-600">
          {currency} {totalEarnings.toFixed(2)}
        </p>
        <p className="text-sm text-gray-500 mt-1">Last 7 days trend by project</p>
      </div>
      
      {chartData.length > 0 ? (
        <ChartContainer
          config={chartConfig}
          className="h-64 w-full"
        >
          <LineChart data={chartData}>
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6B7280' }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6B7280' }}
              tickFormatter={(value) => `${currency} ${value}`}
            />
            {projects.map((project, index) => (
              <Line
                key={project.id}
                type="monotone"
                dataKey={project.id}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={{ fill: colors[index % colors.length], strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5, stroke: colors[index % colors.length], strokeWidth: 2 }}
              />
            ))}
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              content={({ payload }) => (
                <div className="flex flex-wrap justify-center gap-4 text-xs">
                  {payload?.map((entry, index) => {
                    const project = projects.find(p => p.id === entry.dataKey);
                    return (
                      <div key={index} className="flex items-center gap-1">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-gray-600 truncate max-w-20">
                          {project?.name || entry.value}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            />
            <ChartTooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white p-3 border rounded-lg shadow-lg">
                      <p className="font-medium text-gray-900 mb-2">{label}</p>
                      {payload.map((data, index) => {
                        const project = projects.find(p => p.id === data.dataKey);
                        if (!project || Number(data.value) === 0) return null;
                        return (
                          <div key={index} className="flex items-center justify-between gap-2 text-sm">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-2 h-2 rounded-full" 
                                style={{ backgroundColor: data.color }}
                              />
                              <span className="text-gray-600 truncate max-w-24">
                                {project.name}
                              </span>
                            </div>
                            <span className="font-semibold" style={{ color: data.color }}>
                              {currency} {Number(data.value).toFixed(2)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                }
                return null;
              }}
            />
          </LineChart>
        </ChartContainer>
      ) : (
        <div className="h-64 flex items-center justify-center text-gray-500">
          <p>No earnings data available</p>
        </div>
      )}
    </div>
  );
};

export default EarningsLineChart;
