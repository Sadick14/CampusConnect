
import { PageHeader } from "@/components/common/page-header";
import { PlaceholderContent } from "@/components/common/placeholder-content";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

export default function StudentsPage() {
  return (
    <div>
      <PageHeader 
        title="Student Management"
        description="Manage student records, profiles, and enrollment."
        actions={<Button><UserPlus className="mr-2 h-4 w-4" /> Add New Student</Button>}
      />
      <PlaceholderContent 
        title="Manage Students" 
        message="This section will feature comprehensive tools for student data management, including admissions, class assignments, and more." 
      />
    </div>
  );
}
