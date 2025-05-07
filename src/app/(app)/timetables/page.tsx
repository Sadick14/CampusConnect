
import { PageHeader } from "@/components/common/page-header";
import { PlaceholderContent } from "@/components/common/placeholder-content";
import { Button } from "@/components/ui/button";
import { CalendarPlus } from "lucide-react";

export default function TimetablesPage() {
  return (
    <div>
      <PageHeader 
        title="Timetable Management"
        description="Create, manage, and view school timetables."
        actions={<Button><CalendarPlus className="mr-2 h-4 w-4" /> Create Timetable</Button>}
      />
      <PlaceholderContent 
        title="Manage Timetables" 
        message="This module will facilitate the creation of class and teacher timetables, manage subject allocations, and provide easy viewing options." 
      />
    </div>
  );
}
