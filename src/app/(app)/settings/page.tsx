'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFirebase } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsPage() {
  const { user, isUserLoading } = useFirebase();

  return (
    <>
      <PageHeader title="Settings" />
      <Card>
        <CardHeader>
          <CardTitle>Your Profile</CardTitle>
          <CardDescription>Your personal information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isUserLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-16 w-full" />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user?.email || 'No email associated with this account.'} disabled />
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
