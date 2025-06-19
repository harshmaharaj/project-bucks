
import React from 'react';
import { Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AdminStatsProps {
  totalUsers: number;
  totalProjects: number;
}

const AdminStats = ({ totalUsers, totalProjects }: AdminStatsProps) => {
  return (
    <Card className="mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-lg text-orange-800">
          <Users className="w-5 h-5 mr-2" />
          Admin Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-orange-600">{totalUsers}</div>
            <div className="text-sm text-orange-700">Total Users</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">{totalProjects}</div>
            <div className="text-sm text-orange-700">Total Projects</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminStats;
