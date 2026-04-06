"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Card, Heading, Text } from '@/components/ui/redesigned';
import { Eye, EyeOff, User, Building, Lock, AlertCircle } from 'lucide-react';

interface MerchantData {
  businessName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function AdminSetupPage() {
  const [formData, setFormData] = useState<MerchantData>({
    businessName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [token, setToken] = useState('');

  const router = useRouter();

  // Check authorization on component mount
  useEffect(() => {
    checkSetupAvailable();
  }, []);

  const checkSetupAvailable = async () => {
    try {
      const response = await fetch('/api/admin/setup/check');
      if (response.ok) {
        const data = await response.json();
        setIsAuthorized(data.available);
      } else {
        setIsAuthorized(false);
      }
    } catch {
      setIsAuthorized(false);
    }
  };

  const verifyToken = async () => {
    try {
      const response = await fetch('/api/admin/setup/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        setIsAuthorized(true);
        setError(null);
      } else {
        setError('Invalid setup token');
      }
    } catch {
      setError('Token verification failed');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/setup/create-merchant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          businessName: formData.businessName,
          email: formData.email,
          password: formData.password,
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create merchant account');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (isAuthorized === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <Text>Checking setup availability...</Text>
        </div>
      </div>
    );
  }

  // Not available
  if (isAuthorized === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <Heading level={2} className="mb-4">Setup Not Available</Heading>
          <Text className="mb-6">
            Admin setup is not available. This could be because:
          </Text>
          <ul className="text-sm text-gray-600 text-left mb-6 space-y-2">
            <li>• Setup mode is disabled</li>
            <li>• A merchant account already exists</li>
            <li>• This environment doesn&apos;t support setup</li>
          </ul>
          <Button onClick={() => router.push('/login')}>
            Go to Login
          </Button>
        </Card>
      </div>
    );
  }

  // Token verification needed
  if (isAuthorized === true && !token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto p-8">
          <Lock className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <Heading level={2} className="text-center mb-4">Admin Setup</Heading>
          <Text className="text-center mb-6">
            Enter the setup token to create the first merchant account.
          </Text>

          <div className="space-y-4">
            <Input
              label="Setup Token"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Enter setup token..."
              required
            />

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
                {error}
              </div>
            )}

            <Button
              onClick={verifyToken}
              disabled={!token}
              className="w-full"
            >
              Verify Token
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-green-600" />
          </div>
          <Heading level={2} className="mb-4 text-green-800">Setup Complete!</Heading>
          <Text className="mb-6">
            Merchant account created successfully. You will be redirected to the login page shortly.
          </Text>
          <div className="text-sm text-gray-600">
            <p><strong>Email:</strong> {formData.email}</p>
            <p><strong>Business:</strong> {formData.businessName}</p>
          </div>
        </Card>
      </div>
    );
  }

  // Main form
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
      <Card className="max-w-md mx-auto p-8">
        <div className="text-center mb-8">
          <Building className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <Heading level={1} className="mb-2">Create First Merchant</Heading>
          <Text>Set up your merchant account to get started.</Text>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Business Name"
            type="text"
            value={formData.businessName}
            onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
            placeholder="Your Business Name"
            required
          />

          <Input
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="admin@yourbusiness.com"
            required
          />

          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Choose a strong password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <Input
            label="Confirm Password"
            type={showPassword ? "text" : "password"}
            value={formData.confirmPassword}
            onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
            placeholder="Confirm your password"
            required
          />

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded border border-red-200">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            loading={isLoading}
            className="w-full"
          >
            {isLoading ? 'Creating Account...' : 'Create Merchant Account'}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <Text className="text-center text-sm text-gray-600">
            This setup page will be automatically disabled after creating the first merchant.
          </Text>
        </div>
      </Card>
    </div>
  );
}