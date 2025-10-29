'use client';

import { useEffect, useMemo, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Lock, ArrowLeft, AlertCircle } from 'lucide-react';

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
  const { user, isLoaded, isSignedIn } = useUser();
  const [dbRole, setDbRole] = useState<string | null>(null);
  const [isFetchingRole, setIsFetchingRole] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const shouldFetchRole =
      !normalizeRole(user?.publicMetadata?.role as string | undefined) &&
      !normalizeRole(user?.unsafeMetadata?.role as string | undefined);

    if (!isSignedIn || !user?.id || !shouldFetchRole) {
      setDbRole(null);
      return undefined;
    }

    const fetchRole = async () => {
      setIsFetchingRole(true);
      setFetchError(null);
      try {
        const response = await fetch('/api/auth/sync-user');
        if (!response.ok) {
          throw new Error('Failed to fetch user role from database');
        }
        const data = await response.json();
        if (isMounted) {
          setDbRole(data.user?.role ?? null);
        }
      } catch (error) {
        if (isMounted) {
          setFetchError(
            error instanceof Error ? error.message : 'Unable to fetch user role'
          );
        }
      } finally {
        if (isMounted) {
          setIsFetchingRole(false);
        }
      }
    };

    fetchRole();

    return () => {
      isMounted = false;
    };
  }, [isSignedIn, user?.id, user?.publicMetadata?.role, user?.unsafeMetadata?.role]);

  const resolvedRole = useMemo(() => {
    const metadataRole =
      normalizeRole(user?.publicMetadata?.role as string | undefined) ??
      normalizeRole(user?.unsafeMetadata?.role as string | undefined) ??
      normalizeRole(dbRole);
    return metadataRole;
  }, [user?.publicMetadata?.role, user?.unsafeMetadata?.role, dbRole]);

  const hasPermission =
    !!resolvedRole &&
    (allowedRoles.includes(resolvedRole) ||
      (resolvedRole === 'ADMIN' && !allowedRoles.includes('ADMIN')));

  if (!isLoaded || isFetchingRole) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            Verifying your access to the {dashboardName}...
          </p>
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
            <CardTitle className="text-xl text-gray-900">
              Sign in required
            </CardTitle>
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
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  Sign In
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-yellow-600" />
            </div>
            <CardTitle className="text-xl text-gray-900">
              Unable to verify role
            </CardTitle>
            <CardDescription className="text-gray-600">
              {fetchError}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Please refresh the page or contact support if the issue persists.
            </p>
            <Button onClick={() => window.location.reload()}>
              Retry Verification
            </Button>
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
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800">
                    Required roles
                  </h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    {allowedRoles.join(', ')}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <Link href="/" className="flex-1">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </Link>
              <Link href="/support" className="flex-1">
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  Contact Support
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
