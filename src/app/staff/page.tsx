import { PageHeader } from "@/components/common/page-header";
import { PlaceholderContent } from "@/components/common/placeholder-content";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

export default function StaffPage() {
  return (
    <div>
      <PageHeader 
        title="Staff Management"
        description="Oversee staff profiles, roles, and assignments."
        actions={<Button><UserPlus className="mr-2 h-4 w-4" /> Add New Staff</Button>}
      />
      <PlaceholderContent 
        title="Manage Staff" 
        message="This section will allow you to manage teacher and other staff member profiles, assign roles, and track their information." 
      />
    </div>
  );
}
