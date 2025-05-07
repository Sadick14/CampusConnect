import { PageHeader } from "@/components/common/page-header";
import { PlaceholderContent } from "@/components/common/placeholder-content";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export default function SchoolsPage() {
  return (
    <div>
      <PageHeader 
        title="School Management"
        description="Register and manage schools using CampusConnect Pro."
        actions={<Button><PlusCircle className="mr-2 h-4 w-4" /> Add New School</Button>}
      />
      <PlaceholderContent 
        title="Manage Schools" 
        message="This section will allow you to register new schools, manage licenses, and view school details." 
      />
    </div>
  );
}
