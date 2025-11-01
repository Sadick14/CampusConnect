import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex h-full min-h-[calc(100vh-theme(spacing.14))] flex-col items-center justify-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="mt-4 text-lg text-muted-foreground">Loading Syntra...</p>
    </div>
  );
}
