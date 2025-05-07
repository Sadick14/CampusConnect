import { LoginForm } from '@/components/auth/login-form';
import { Logo } from '@/components/logo';
import { AlertCircle, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-background via-background to-primary/10 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Title */}
        <div className="text-center">
          <Link href="/" className="inline-block mb-6">
             <div className="flex items-center justify-center gap-2 p-2">
                 <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-12 w-12" // Slightly larger logo
                >
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                </svg>
                <h1 className="text-4xl font-bold text-primary">
                    CampusConnect Pro
                </h1>
            </div>
          </Link>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Sign in to manage your school effectively
          </p>
        </div>

        {/* Firebase Config Alert */}
        <Alert variant="destructive" className="shadow-md border-l-4 border-destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Action Required: Firebase Configuration</AlertTitle>
          <AlertDescription>
            Ensure your <code className="font-mono bg-muted px-1 rounded text-xs">.env</code> file is correctly configured with Firebase credentials. Authentication will fail otherwise.
          </AlertDescription>
        </Alert>

        {/* Login Form */}
        <LoginForm />

        {/* Super Admin Setup Info */}
        <Card className="shadow-md border border-muted/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-foreground">
              <ShieldAlert className="h-5 w-5 text-amber-500" />
              Super Admin Account Setup
            </CardTitle>
            <CardDescription className="text-xs leading-relaxed">
             A Firebase Auth user MUST be created manually first:
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm space-y-3">
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Go to Firebase Console → Authentication → Add user.</li>
              <li>Use any email (e.g., <code className="bg-muted px-1 rounded text-xs">superadmin@example.com</code>).</li>
              <li>
                Set the User UID to <strong className="text-primary font-semibold"><code className="bg-primary/10 px-1 rounded text-xs font-mono">superadmin</code></strong> (Exactly this UID).
              </li>
            </ol>
            <p className="text-xs text-muted-foreground/80">
              Logging in with this manually created Auth user (UID: superadmin) grants full system access. The Firestore profile is created/updated on first login.
            </p>
          </CardContent>
        </Card>

        {/* Other User Login Info */}
        <Card className="shadow-md border border-muted/50">
           <CardHeader className="pb-3">
             <CardTitle className="text-lg flex items-center gap-2 text-foreground">
               <ShieldAlert className="h-5 w-5 text-blue-500" />
               School Admin & Other Users
             </CardTitle>
             <CardDescription className="text-xs leading-relaxed">
                For users created via the app (Schools or Users page):
             </CardDescription>
           </CardHeader>
           <CardContent className="text-sm space-y-3">
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Note the <strong className="text-primary font-semibold">Firestore Document ID</strong> provided by the app after profile creation.</li>
                <li>Manually create a Firebase Auth user:</li>
                 <ul className="list-disc list-inside pl-5 text-xs">
                    <li>Email: Use the same email as the Firestore profile.</li>
                    <li>User UID: Set this to the <strong className="text-primary font-semibold">Firestore Document ID</strong>.</li>
                 </ul>
                 <li>The user can then log in with their email and password.</li>
              </ol>
               <p className="text-xs text-muted-foreground/80">
                 This process links the login credentials (Firebase Auth) to the user's profile and role within the application (Firestore).
               </p>
           </CardContent>
        </Card>

      </div>
    </div>
  );
}
