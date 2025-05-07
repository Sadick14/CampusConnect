import { LoginForm } from '@/components/auth/login-form';
import { Logo } from '@/components/logo'; 
import { ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary/10 via-background to-background p-4">
      <div className="mb-8">
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
      
      <Card className="w-full max-w-md shadow-xl mt-6 border-primary border-2">
        <CardHeader className="bg-primary/5 dark:bg-primary/10">
          <CardTitle className="text-primary flex items-center">
            <ShieldAlert className="mr-2 h-6 w-6 text-destructive" />
            Important: Super Admin Account Setup
          </CardTitle>
          <CardDescription className="text-foreground/90 space-y-2">
           <span>To use the Super Admin account, you <strong className="text-destructive-foreground bg-destructive px-1 rounded">MUST FIRST MANUALLY CREATE</strong> this user in your Firebase project:</span>
            <ol className="list-decimal list-inside mt-2 space-y-1 bg-muted/50 p-3 rounded border border-dashed border-muted-foreground/50">
              <li>Go to Firebase Console → Authentication → Users → Add user.</li>
              <li>You can use any email (e.g., <code className="bg-muted px-1 rounded text-sm">superadmin@example.com</code> or your own <code className="bg-muted px-1 rounded text-sm">issakasaddick14@gmail.com</code>) and set a password.</li>
               <li>
                <strong>Crucially, set the User UID to exactly <code className="bg-destructive text-destructive-foreground px-1 rounded font-mono">superadmin</code></strong>. This specific UID links the Auth user to the superadmin role in the system.
                </li>
            </ol>
            <span>Once the Firebase Auth user is created with UID <code className="font-mono">superadmin</code>, logging in with that user's credentials will grant superadmin privileges. The system will create/update the corresponding Firestore profile (<code className="font-mono">users/superadmin</code>) upon first successful login.</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="font-semibold">Suggested Email: <code className="bg-muted px-2 py-1 rounded text-sm text-foreground font-mono">superadmin@example.com</code> (or your chosen email)</p>
          <p className="font-semibold mt-1">Password: <code className="bg-muted px-2 py-1 rounded text-sm text-foreground font-mono">password</code> (or the password you set)</p>
           <p className="font-semibold mt-1">REQUIRED UID: <code className="bg-destructive text-destructive-foreground px-2 py-1 rounded text-sm font-mono">superadmin</code></p>
        </CardContent>
      </Card>
        
      <Card className="w-full max-w-md shadow-xl mt-6 border-accent border-2">
         <CardHeader className="bg-accent/5 dark:bg-accent/10">
           <CardTitle className="text-accent flex items-center">
            <ShieldAlert className="mr-2 h-6 w-6 text-orange-500" />
             School Admin & Other User Login (Post-Profile Creation)
           </CardTitle>
           <CardDescription className="text-foreground/90 space-y-2">
            <span>When a new school is registered by a superadmin, or a new user profile is added via the "Users" page, a Firestore profile is created. The system will provide a <strong className="text-primary">Firestore Document ID</strong> for this profile.</span>
             <ol className="list-decimal list-inside mt-2 space-y-1 bg-muted/50 p-3 rounded border border-dashed border-muted-foreground/50">
               <li>You <strong className="text-destructive-foreground bg-destructive px-1 rounded">MUST MANUALLY CREATE</strong> a Firebase Authentication user for the admin/user:</li>
                <ul className="list-disc list-inside pl-4">
                    <li>Email: The email specified during profile creation (e.g., <code className="bg-muted px-1 rounded text-sm">admin@schoolname.com</code>).</li>
                    <li>Password: Set a temporary password.</li>
                    <li><strong>User UID: Set this to the <span className="text-primary font-semibold">Firestore Document ID</span></strong> that was provided when the profile was created in the app. This is essential to link the Auth user to their Firestore profile and role.</li>
                </ul>
               <li>The user can then log in using their email and the temporary password. They should change their password promptly.</li>
             </ol>
           </CardDescription>
         </CardHeader>
      </Card>
    </div>
  );
}
