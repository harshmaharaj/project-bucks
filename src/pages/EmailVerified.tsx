import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { toast } from 'sonner';

const EmailVerified = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    // If user is authenticated, start countdown and redirect
    if (!loading && user) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            toast.success('Welcome! Your email has been verified successfully.');
            navigate('/dashboard');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [user, loading, navigate]);

  const handleContinue = () => {
    toast.success('Welcome! Your email has been verified successfully.');
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  // If user is not authenticated, something went wrong
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Verification Issue
            </h1>
            <p className="text-gray-600 mb-6">
              There was an issue with your email verification. Please try signing in or contact support.
            </p>
            <Button onClick={() => navigate('/auth')} className="w-full">
              Go to Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="text-center max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          {/* Success Icon */}
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <Check className="w-8 h-8 text-green-600" />
          </div>

          {/* Success Message */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Email Verified Successfully! 🎉
          </h1>
          
          <p className="text-gray-600 mb-6">
            Your email address has been confirmed. You can now access all features of your account.
          </p>

          {/* Auto-redirect countdown */}
          <div className="mb-6">
            <p className="text-sm text-gray-500 mb-2">
              Redirecting to dashboard in {countdown} seconds...
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${((3 - countdown) / 3) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Manual continue button */}
          <Button 
            onClick={handleContinue}
            className="w-full"
          >
            Continue to Dashboard
          </Button>
        </div>

        {/* Additional info */}
        <p className="text-sm text-gray-500">
          Having trouble? <Button variant="link" onClick={() => navigate('/auth')} className="p-0 h-auto">Try signing in again</Button>
        </p>
      </div>
    </div>
  );
};

export default EmailVerified;