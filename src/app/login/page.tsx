
import { LoginForm } from '@/components/auth/login-form';
import { Logo } from '@/components/logo'; // Assuming logo can be used standalone
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
      <Card className="w-full max-w-md shadow-xl mt-4">
        <CardHeader>
          <CardTitle className="text-primary">Super Admin Login (For Testing)</CardTitle>
          <CardDescription>Use this to test the registration features.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Email: superadmin@example.com</p>
          <p>Password: password</p>
        </CardContent>
      </Card>
    </div>
  );
}

