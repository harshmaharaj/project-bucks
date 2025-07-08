import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Clock, Users, BarChart3 } from 'lucide-react';
const Welcome = () => {
  const navigate = useNavigate();
  return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Illustration Area */}
        <div className="mb-8">
          <div className="w-64 h-64 mx-auto bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center relative overflow-hidden">
            {/* Simple illustration using icons */}
            <div className="relative z-10">
              <div className="flex items-center justify-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                  <Clock className="w-8 h-8 text-white" />
                </div>
                <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
              </div>
              <div className="w-16 h-16 bg-purple-600 rounded-full mx-auto flex items-center justify-center">
                <Users className="w-8 h-8 text-white" />
              </div>
            </div>
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-full"></div>
          </div>
        </div>

        {/* Content */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to<br />TimeTracker
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed ">Track Your Time and Earnings of multiple project</p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Button onClick={() => navigate('/auth')} className="w-full h-12 text-lg bg-gray-900 hover:bg-gray-800 text-white rounded-2xl">
            Login
          </Button>
          <Button onClick={() => navigate('/auth')} variant="outline" className="w-full h-12 text-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-2xl">Register</Button>
        </div>
      </div>
    </div>;
};
export default Welcome;