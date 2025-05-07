import { PageHeader } from "@/components/common/page-header";
import { PlaceholderContent } from "@/components/common/placeholder-content";
import { Button } from "@/components/ui/button";
import { FilePlus2 } from "lucide-react";

export default function GradesPage() {
  return (
    <div>
      <PageHeader 
        title="Grades & Assessments"
        description="Manage student grades, assessments, and generate grade reports."
        actions={<Button><FilePlus2 className="mr-2 h-4 w-4" /> Add New Grade</Button>}
      />
      <PlaceholderContent 
        title="Manage Grades" 
        message="This section will provide tools for inputting grades, managing assessment criteria, and generating individual or class grade reports." 
      />
    </div>
  );
}
