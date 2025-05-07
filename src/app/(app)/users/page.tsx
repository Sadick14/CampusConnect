
import { PageHeader } from "@/components/common/page-header";
import { PlaceholderContent } from "@/components/common/placeholder-content";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

export default function UsersPage() {
  return (
    <div>
      <PageHeader 
        title="User Management"
        description="Administer user accounts and roles across different schools."
        actions={<Button><UserPlus className="mr-2 h-4 w-4" /> Add New User</Button>}
      />
      <PlaceholderContent 
        title="Manage Users" 
        message="This section will allow you to create, edit, and assign roles to users (admins, teachers, students)." 
      />
    </div>
  );
}
