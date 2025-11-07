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
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FirebaseError } from 'firebase/app';

function getAuthErrorMessage(error: FirebaseError): string {
    switch (error.code) {
        case 'auth/invalid-credential':
            return 'Invalid email or password. Please try again.';
        case 'auth/email-already-in-use':
            return 'An account with this email already exists. Please log in.';
        case 'auth/weak-password':
            return 'Password is too weak. It should be at least 6 characters long.';
        case 'auth/user-not-found':
            return 'No account found with this email. Please sign up.';
        default:
            return 'An unexpected error occurred. Please try again.';
    }
}

function LoginPageContent() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);
  
  const handleAuthAction = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const handleError = (error: FirebaseError) => {
        setAuthError(getAuthErrorMessage(error));
    };

    if (isSigningUp) {
      initiateEmailSignUp(auth, email, password, firstName, lastName, handleError);
    } else {
      initiateEmailSignIn(auth, email, password, handleError);
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
            {isSigningUp && (
              <>
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input id="firstName" placeholder="John" required value={firstName} onChange={e => setFirstName(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input id="lastName" placeholder="Doe" required value={lastName} onChange={e => setLastName(e.target.value)} />
                    </div>
                </div>
              </>
            )}
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
              <div className="relative">
                <Input 
                    id="password" 
                    type={showPassword ? 'text' : 'password'} 
                    required 
                    value={password} 
                    onChange={e => setPassword(e.target.value)}
                    className="pr-10"
                />
                <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span className="sr-only">{showPassword ? 'Hide password' : 'Show password'}</span>
                </Button>
              </div>
            </div>
            {authError && (
                <Alert variant="destructive">
                    <AlertDescription>{authError}</AlertDescription>
                </Alert>
            )}
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
              {isSigningUp ? 'Sign Up' : 'Login'}
            </Button>
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
