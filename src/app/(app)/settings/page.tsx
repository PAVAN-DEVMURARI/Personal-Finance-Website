import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SettingsPage() {
    return (
        <>
            <PageHeader title="Settings" />
            <Card>
                <CardHeader>
                    <CardTitle>Under Construction</CardTitle>
                    <CardDescription>This settings page is currently under construction. Check back later!</CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Future settings options will appear here, such as:</p>
                    <ul className="list-disc pl-6 mt-2 text-muted-foreground">
                        <li>Profile management</li>
                        <li>Notification preferences</li>
                        <li>Theme settings (Light/Dark)</li>
                        <li>Data export and import</li>
                    </ul>
                </CardContent>
            </Card>
        </>
    );
}
