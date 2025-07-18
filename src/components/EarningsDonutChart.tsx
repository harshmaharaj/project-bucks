
import React from 'react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { formatTime, calculateEarnings } from '@/utils/timeUtils';

interface Project {
  id: string;
  name: string;
  hourly_rate: number;
  rate_currency: string;
  total_time: number;
}

interface EarningsDonutChartProps {
  projects: Project[];
}

const EarningsDonutChart = ({ projects }: EarningsDonutChartProps) => {
  const chartData = projects.map((project, index) => {
    const earnings = parseFloat(calculateEarnings(project.total_time, project.hourly_rate));
    return {
      name: project.name,
      value: earnings,
      fill: `hsl(${(index * 137.5) % 360}, 70%, 50%)` // Generate different colors
    };
  });

  const totalEarnings = chartData.reduce((sum, item) => sum + item.value, 0);
  const currency = projects.length > 0 ? projects[0].rate_currency : 'USD';

  const chartConfig = {
    earnings: {
      label: "Earnings",
    },
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border">
      {/* Header Row */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Total Earnings</h3>
        <p className="text-2xl font-bold text-blue-600">
          {currency} {totalEarnings.toFixed(2)}
        </p>
      </div>
      
      {/* Chart and Legend Row */}
      {chartData.length > 0 ? (
        <div className="flex items-center gap-6">
          {/* Donut Chart - Left Side */}
          <div className="flex-shrink-0">
            <ChartContainer
              config={chartConfig}
              className="h-32 w-32"
            >
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={25}
                  outerRadius={50}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0];
                      return (
                        <div className="bg-white p-2 border rounded shadow-lg">
                          <p className="font-medium">{data.name}</p>
                          <p className="text-blue-600">
                            {currency} {Number(data.value).toFixed(2)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ChartContainer>
          </div>
          
          {/* Legend - Right Side */}
          <div className="flex-1 space-y-2">
            {chartData.map((entry, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: entry.fill }}
                />
                <span className="flex-1 truncate text-gray-700">{entry.name}</span>
                <span className="font-medium text-gray-900">
                  {currency} {entry.value.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="h-32 flex items-center justify-center text-gray-500">
          <p>No earnings data available</p>
        </div>
      )}
    </div>
  );
};

export default EarningsDonutChart;
