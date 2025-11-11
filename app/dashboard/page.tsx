'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUserFromToken, removeToken } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Main dashboard page
 * Displays user information and will contain contract management features
 */
export default function DashboardPage() {
  const router = useRouter();
  // Initialize state directly with token data (no useEffect needed)
  const [user] = useState<{ username: string; exp: number } | null>(() => getUserFromToken());

  /**
   * Handle user logout
   * Clears token and redirects to login page
   */
  const handleLogout = () => {
    removeToken();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with logout button */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back, {user?.username || 'User'}</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>

        {/* Main content area */}
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Business Contract Manager v2</CardTitle>
              <CardDescription>Contract management system</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Dashboard features will be implemented in the next development phase.
              </p>
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Coming soon:</h3>
                <ul className="space-y-1 text-sm text-blue-700">
                  <li>• Contract statistics and KPIs</li>
                  <li>• Active contracts overview</li>
                  <li>• Contract status charts</li>
                  <li>• Manager assignments</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* User info card */}
          <Card>
            <CardHeader>
              <CardTitle>Session Information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Username</dt>
                  <dd className="text-sm text-gray-900">{user?.username || 'Loading...'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Token Expiration</dt>
                  <dd className="text-sm text-gray-900">
                    {user?.exp ? new Date(user.exp * 1000).toLocaleString('en-US') : 'Loading...'}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
