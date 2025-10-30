'use client';

import { useState, useEffect } from 'react';
import { SignUp, useUser } from "@clerk/nextjs";
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import RoleSelection from '@/components/RoleSelection';
import { UserRole } from '@/utils/roleManager';
import { ArrowLeft, User, Shield, Loader2 } from 'lucide-react';
import { getRoleDashboardPath } from '@/utils/dashboardRoutes';

export default function SignupPage() {
  const router = useRouter();
  const { user, isLoaded, isSignedIn } = useUser();
  const [step, setStep] = useState<'role' | 'signup'>('role');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check if Clerk keys are properly configured
  const hasValidClerkKeys = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== 'pk_test_placeholder_key_for_development_only';

  // Redirect if user is already signed in
  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      // Get user's role and redirect to their dashboard
      const userRole = user.publicMetadata?.role as string | undefined;
      const dashboardPath = getRoleDashboardPath(userRole || 'BUYER');

      console.log('User already signed in, redirecting to:', dashboardPath);
      router.push(dashboardPath);
    }
  }, [isLoaded, isSignedIn, user, router]);

  // Show loading while checking authentication
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If user is signed in, show loading while redirecting
  if (isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">You're already signed in. Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
  };

  const handleContinue = () => {
    if (selectedRole) {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('lovtiti:selectedRole', selectedRole);
      }
      setStep('signup');
    }
  };

  const handleBack = () => {
    setStep('role');
  };

  if (step === 'role') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="w-full max-w-6xl">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
                <Shield className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Join Lovtiti Agro Mart</h1>
            <p className="text-xl text-gray-600">
              Connect with Africa's agricultural ecosystem
            </p>
          </div>
          
          <RoleSelection
            selectedRole={selectedRole}
            onRoleSelect={handleRoleSelect}
            onContinue={handleContinue}
            isLoading={isLoading}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl">Complete Your Registration</CardTitle>
            <CardDescription>
              You're signing up as a <span className="font-semibold text-green-600">
                {selectedRole?.replace('_', '-') || 'User'}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <Button
                variant="outline"
                onClick={handleBack}
                className="w-full mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Change Role
              </Button>
            </div>
            
            <div className="space-y-4">
              {hasValidClerkKeys ? (
                <SignUp
                  routing="hash"
                  afterSignUpUrl={`/auth/signup/success?role=${selectedRole ?? 'buyer'}`}
                  signInUrl="/auth/login"
                  forceRedirectUrl={`/auth/signup/success?role=${selectedRole ?? 'buyer'}`}
                  appearance={{
                    elements: {
                      formButtonPrimary: "bg-green-600 hover:bg-green-700 text-white",
                      card: "shadow-none",
                      headerTitle: "hidden",
                      headerSubtitle: "hidden",
                      socialButtonsBlockButton: "border-gray-300 hover:border-green-300",
                      formFieldInput: "border-gray-300 focus:border-green-500 focus:ring-green-500",
                      footerActionLink: "text-green-600 hover:text-green-700"
                    }
                  }}
                  unsafeMetadata={{
                    role: selectedRole
                  }}
                />
              ) : (
                <div className="text-center p-6">
                  <h3 className="text-lg font-semibold mb-4">Authentication Setup Required</h3>
                  <p className="text-gray-600 mb-4">
                    Clerk authentication is not configured. Please add your Clerk API keys to the .env file.
                  </p>
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Setup Required:</strong> Add your Clerk API keys to enable user registration.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
