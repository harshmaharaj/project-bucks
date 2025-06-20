
import React from 'react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';
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
  // Generate chart data for the last 7 days
  const generateChartData = () => {
    const data = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      let dayEarnings = 0;
      
      projects.forEach(project => {
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
      });
      
      data.push({
        date: dateStr,
        earnings: parseFloat(dayEarnings.toFixed(2))
      });
    }
    
    return data;
  };

  const chartData = generateChartData();
  const totalEarnings = projects.reduce((sum, project) => {
    const earnings = parseFloat(calculateEarnings(project.total_time, project.hourly_rate));
    return sum + earnings;
  }, 0);
  
  const currency = projects.length > 0 ? projects[0].rate_currency : 'USD';

  const chartConfig = {
    earnings: {
      label: "Daily Earnings",
    },
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Total Earnings</h3>
        <p className="text-2xl font-bold text-blue-600">
          {currency} {totalEarnings.toFixed(2)}
        </p>
        <p className="text-sm text-gray-500 mt-1">Last 7 days trend</p>
      </div>
      
      {chartData.length > 0 ? (
        <ChartContainer
          config={chartConfig}
          className="h-48 w-full"
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
            <Line
              type="monotone"
              dataKey="earnings"
              stroke="#3B82F6"
              strokeWidth={3}
              dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
            />
            <ChartTooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0];
                  return (
                    <div className="bg-white p-3 border rounded-lg shadow-lg">
                      <p className="font-medium text-gray-900">{label}</p>
                      <p className="text-blue-600 font-semibold">
                        {currency} {Number(data.value).toFixed(2)}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </LineChart>
        </ChartContainer>
      ) : (
        <div className="h-48 flex items-center justify-center text-gray-500">
          <p>No earnings data available</p>
        </div>
      )}
    </div>
  );
};

export default EarningsLineChart;
