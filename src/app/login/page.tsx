'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FinpowerLogo } from '@/components/finpower-logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, useUser, initiateEmailSignUp, initiateEmailSignIn, FirebaseClientProvider } from '@/firebase';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

function LoginPageContent() {
  const auth = useAuth();
  const { user, isUserLoading, userError } = useUser();
  const router = useRouter();
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);
  
  useEffect(() => {
    if(userError) {
      setAuthError(userError.message);
    }
  }, [userError]);

  const handleAuthAction = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (isSigningUp) {
      initiateEmailSignUp(auth, email, password);
    } else {
      initiateEmailSignIn(auth, email, password);
    }
  };

  const toggleAuthMode = () => {
    setIsSigningUp(!isSigningUp);
    setAuthError(null);
  }

  if (isUserLoading || user) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 sm:p-6 lg:p-8">
      <Card className="mx-auto w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <FinpowerLogo className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="font-headline text-2xl">{isSigningUp ? 'Create an Account' : 'Welcome to FinPower'}</CardTitle>
          <CardDescription>{isSigningUp ? 'Sign up to start managing your finances.' : 'Enter your credentials to access your financial dashboard.'}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuthAction} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                {!isSigningUp && (
                  <Link href="#" className="ml-auto inline-block text-sm underline" prefetch={false}>
                    Forgot password?
                  </Link>
                )}
              </div>
              <Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            {authError && (
                <Alert variant="destructive">
                    <AlertDescription>{authError}</AlertDescription>
                </Alert>
            )}
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
              {isSigningUp ? 'Sign Up' : 'Login'}
            </Button>
            {/* <Button variant="outline" className="w-full">
              <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                <path fill="currentColor" d="M488 261.8C488 403.3 381.5 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 21.2 172.8 56.2l-78.3 78.3c-33.1-30-76.2-48.5-124.5-48.5-97.1 0-175.8 78.8-175.8 176s78.7 176 175.8 176c103.5 0 162.2-73.4 168.5-109.9H248v-86.3h239.9c.4 12.9 1 26.3 1 40.2z"></path>
              </svg>
              Login with Google
            </Button> */}
          </form>
          <div className="mt-4 text-center text-sm">
            {isSigningUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <Button variant="link" onClick={toggleAuthMode} className="p-0 h-auto">
              {isSigningUp ? 'Login' : 'Sign up'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


export default function LoginPage() {
  return (
    <FirebaseClientProvider>
      <LoginPageContent />
    </FirebaseClientProvider>
  )
}
