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
        // Save the role to the user's metadata
        const response = await fetch('/api/auth/assign-role', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ role: selectedRole }),
        });

        if (response.ok) {
          console.log('Role assigned successfully:', selectedRole);
          // Redirect to the appropriate dashboard
          window.location.href = `/dashboard/${selectedRole.toLowerCase().replace('_', '-')}`;
        } else {
          console.error('Failed to assign role');
        }
      } catch (error) {
        console.error('Error assigning role:', error);
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
              <SignUp 
                routing="hash"
                afterSignUpUrl={`/dashboard/${selectedRole?.toLowerCase().replace('_', '-') || 'farmer'}`}
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
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}