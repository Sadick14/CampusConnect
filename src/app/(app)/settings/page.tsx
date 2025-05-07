
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Building, UserCircle } from "lucide-react";
import Link from "next/link";
import { AuthGuard } from "@/components/auth/auth-guard"; // Use AuthGuard for overall access

export default function SettingsPage() {
  // No need for useAuth here if AuthGuard handles redirection

  return (
    <AuthGuard> {/* Ensure user is logged in to see settings options */}
      <div>
        <PageHeader
          title="Settings"
          description="Manage your account and school settings."
        />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Link to School Settings (will be conditionally rendered based on role inside the target page) */}
          <Link href="/settings/school" passHref>
            <Card className="cursor-pointer shadow-md transition-all hover:shadow-lg hover:border-primary/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Building className="h-5 w-5" /> School Profile
                </CardTitle>
                <CardDescription>
                  Update your school's information and logo. (School Admins only)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Manage address, contact details, website, and branding.
                </p>
              </CardContent>
            </Card>
          </Link>

           {/* Link to User Profile Settings (Placeholder) */}
          <Link href="/settings/profile" passHref>
             <Card className="cursor-pointer shadow-md transition-all hover:shadow-lg hover:border-primary/50">
               <CardHeader>
                 <CardTitle className="flex items-center gap-2 text-primary">
                   <UserCircle className="h-5 w-5" /> User Profile
                 </CardTitle>
                 <CardDescription>
                   Manage your personal account details.
                 </CardDescription>
               </CardHeader>
               <CardContent>
                 <p className="text-sm text-muted-foreground">
                   Update your name, email, or password (feature coming soon).
                 </p>
               </CardContent>
             </Card>
          </Link>

          {/* Add more setting cards here as needed */}

        </div>
      </div>
    </AuthGuard>
  );
}
