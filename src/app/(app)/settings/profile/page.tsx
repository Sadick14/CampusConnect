
import { PageHeader } from "@/components/common/page-header";
import { PlaceholderContent } from "@/components/common/placeholder-content";
import { UserCircle } from "lucide-react";
import { AuthGuard } from "@/components/auth/auth-guard";

export default function UserProfileSettingsPage() {
  return (
      <AuthGuard>
          <div>
              <PageHeader
                  title="User Profile Settings"
                  description="Manage your personal account details."
              />
               <PlaceholderContent
                  title="Profile Management Coming Soon"
                  message="This section will allow you to update your name, email, and password."
                  icon={<UserCircle className="h-16 w-16 text-muted-foreground" />}
               />
          </div>
      </AuthGuard>
  );
}
