import { PageHeader } from "@/components/common/page-header";
import { PlaceholderContent } from "@/components/common/placeholder-content";
import { Button } from "@/components/ui/button";
import { ReceiptText } from "lucide-react";

export default function ExpenditurePage() {
  return (
    <div>
      <PageHeader 
        title="Expenditure Management"
        description="Track and manage school expenditures."
        actions={<Button><ReceiptText className="mr-2 h-4 w-4" /> Add Expenditure</Button>}
      />
      <PlaceholderContent 
        title="Track Expenditures" 
        message="This section will help in recording and categorizing all school-related expenses for better financial management and reporting." 
      />
    </div>
  );
}
