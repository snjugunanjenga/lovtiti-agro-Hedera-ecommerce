'use client';

import { useState } from 'react';
import { SignUp } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import RoleSelection from '@/components/RoleSelection';
import { UserRole } from '@/utils/roleManager';
import { ArrowLeft, User, Shield } from 'lucide-react';

export default function SignupPage() {
  const [step, setStep] = useState<'role' | 'signup'>('role');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check if Clerk keys are properly configured
  const hasValidClerkKeys = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== 'pk_test_placeholder_key_for_development_only';

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
  };

  const handleContinue = () => {
    if (selectedRole) {
      setStep('signup');
    }
  };

  const handleBack = () => {
    setStep('role');
  };

  const handleSignUpSuccess = async () => {
    if (selectedRole) {
      try {
        console.log('🎯 User signup successful, assigning role:', selectedRole);
        
        // Wait a moment for Clerk to fully initialize the user
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Save the role to the user's metadata and database
        const response = await fetch('/api/auth/assign-role', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ role: selectedRole }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Role assigned successfully:', data);
          
          // Wait a moment for the role to be processed
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Sync user to database
          const syncResponse = await fetch('/api/auth/sync-user', {
            method: 'POST',
          });
          
          if (syncResponse.ok) {
            console.log('✅ User synced to database');
          }
          
          // Redirect to the appropriate dashboard based on role
          const dashboardPath = selectedRole === 'VETERINARIAN' ? '/dashboard/agro-vet' : `/dashboard/${selectedRole.toLowerCase()}`;
          window.location.href = dashboardPath;
        } else {
          console.error('Failed to assign role');
          // Still redirect to dashboard even if role assignment fails
          const dashboardPath = selectedRole === 'VETERINARIAN' ? '/dashboard/agro-vet' : `/dashboard/${selectedRole.toLowerCase()}`;
          window.location.href = dashboardPath;
        }
      } catch (error) {
        console.error('Error assigning role:', error);
        // Still redirect to dashboard even if role assignment fails
        const dashboardPath = selectedRole === 'VETERINARIAN' ? '/dashboard/agro-vet' : `/dashboard/${selectedRole.toLowerCase()}`;
        window.location.href = dashboardPath;
      }
    }
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
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Join Lovitti Agro Mart</h1>
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
                  afterSignUpUrl={selectedRole === 'VETERINARIAN' ? '/dashboard/agro-vet' : `/dashboard/${selectedRole?.toLowerCase() || 'farmer'}`}
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