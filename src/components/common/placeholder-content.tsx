import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction } from "lucide-react";

interface PlaceholderContentProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
}

export function PlaceholderContent({ 
  title = "Feature Under Construction", 
  message = "This section is currently under development. Check back soon!",
  icon = <Construction className="h-16 w-16 text-muted-foreground" />
}: PlaceholderContentProps) {
  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="text-center text-xl text-primary">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center gap-4 py-10 text-center">
        {icon}
        <p className="text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
}
