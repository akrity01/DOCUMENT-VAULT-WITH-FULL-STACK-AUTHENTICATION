import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle, User, Shield } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 space-y-8">
        <div className="flex flex-col items-center space-y-2">
          <CheckCircle className="h-12 w-12 text-green-500" />
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.email}!</h1>
          <p className="text-green-700 font-medium">You have logged in successfully.</p>
        </div>
        <div className="mt-6 space-y-4">
          <div className="flex items-center space-x-3">
            <User className="h-6 w-6 text-blue-600" />
            <span className="text-gray-700">Email:</span>
            <span className="font-mono text-gray-900">{user?.email}</span>
          </div>
          <div className="flex items-center space-x-3">
            <Shield className="h-6 w-6 text-purple-600" />
            <span className="text-gray-700">Role:</span>
            <span className="capitalize font-semibold text-gray-900">{user?.role}</span>
          </div>
          <div className="flex items-center space-x-3">
            <CheckCircle className={`h-6 w-6 ${user?.twoFactorEnabled ? 'text-green-600' : 'text-yellow-600'}`} />
            <span className="text-gray-700">Two-Factor Auth:</span>
            <span className={`font-semibold ${user?.twoFactorEnabled ? 'text-green-700' : 'text-yellow-700'}`}>{user?.twoFactorEnabled ? 'Enabled' : 'Not Enabled'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;