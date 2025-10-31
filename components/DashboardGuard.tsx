'use client';

import Link from 'next/link';
import { useUser } from '@/components/auth-client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Lock, ArrowLeft } from 'lucide-react';

interface DashboardGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
  dashboardName: string;
  dashboardDescription: string;
}

const normalizeRole = (role?: string | null) =>
  role ? role.toString().toUpperCase() : null;

export default function DashboardGuard({
  children,
  allowedRoles,
  dashboardName,
  dashboardDescription,
}: DashboardGuardProps) {
  const { user, isLoaded } = useUser();
  const isSignedIn = Boolean(user);
  const resolvedRole = normalizeRole(user?.role);

  const hasPermission =
    !!resolvedRole &&
    (allowedRoles.includes(resolvedRole) ||
      (resolvedRole === 'ADMIN' && !allowedRoles.includes('ADMIN')));

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Verifying your access to the {dashboardName}...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-xl text-gray-900">Sign in required</CardTitle>
            <CardDescription className="text-gray-600">
              Please sign in to access the {dashboardName}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
              {dashboardDescription}
            </div>
            <div className="flex space-x-3">
              <Link href="/" className="flex-1">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </Link>
              <Link href="/auth/login" className="flex-1">
                <Button className="w-full bg-green-600 hover:bg-green-700">Sign In</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasPermission) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-xl text-gray-900">Access denied</CardTitle>
            <CardDescription className="text-gray-600">
              Your role does not grant access to the {dashboardName}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border border-yellow-200 rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800">
              Required roles: {allowedRoles.join(', ')}
            </div>
            <div className="flex space-x-3">
              <Link href="/" className="flex-1">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </Link>
              <Link href="/support" className="flex-1">
                <Button className="w-full bg-green-600 hover:bg-green-700">Contact Support</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
