
import { LoginForm } from '@/components/auth/login-form';
import { Logo } from '@/components/logo'; // Assuming logo can be used standalone
import { ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-background p-4">
      <div className="mb-8">
        {/* Using a simplified logo display here, ensure Logo component is adaptable or create a specific one */}
         <div className="flex items-center gap-2 p-2 justify-center">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-10 w-10"
            >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
            </svg>
            <h1 className="text-3xl font-bold text-primary">
                CampusConnect Pro
            </h1>
        </div>
      </div>
      <LoginForm />
      {/* Super Admin Login - For Testing */}
      <Card className="w-full max-w-md shadow-xl mt-6 border-primary border-2">
        <CardHeader className="bg-primary/5 dark:bg-primary/10">
          <CardTitle className="text-primary flex items-center">
            <ShieldAlert className="mr-2 h-6 w-6 text-destructive" />
            Important: Super Admin Test Account
          </CardTitle>
          <CardDescription className="text-foreground/90">
            To test features as Super Admin, you <strong className="text-destructive-foreground bg-destructive px-1 rounded">MUST FIRST MANUALLY CREATE</strong> this user in your Firebase project:
            <ol className="list-decimal list-inside mt-2 space-y-1 bg-muted/50 p-3 rounded border border-dashed border-muted-foreground/50">
              <li>Go to Firebase Console → Authentication → Users → Add user.</li>
              <li>Use the email and password specified below.</li>
            </ol>
            Once the Firebase Auth user is created, the system will attempt to create the corresponding Firestore user profile if it doesn&apos;t exist upon successful login with these credentials.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="font-semibold">Email: <code className="bg-muted px-2 py-1 rounded text-sm text-foreground font-mono">superadmin@example.com</code></p>
          <p className="font-semibold mt-1">Password: <code className="bg-muted px-2 py-1 rounded text-sm text-foreground font-mono">password</code></p>
        </CardContent>
      </Card>
    </div>
  );
}

