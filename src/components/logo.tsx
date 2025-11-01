
import type { SVGProps } from 'react';

// Syntra Logo Icon - Modern leaf/growth design representing education
function AppLogoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      fill="currentColor"
      {...props}
    >
      {/* Stylized "S" combined with a leaf/growth motif */}
      <path d="M50 10 C30 10, 15 25, 15 40 C15 50, 20 58, 30 62 C20 66, 15 74, 15 85 L25 85 C25 76, 30 70, 40 68 C35 65, 32 60, 32 55 C32 48, 38 42, 50 42 C62 42, 68 48, 68 55 C68 60, 65 65, 60 68 C70 70, 75 76, 75 85 L85 85 C85 74, 80 66, 70 62 C80 58, 85 50, 85 40 C85 25, 70 10, 50 10 Z M50 20 C64 20, 75 28, 75 40 C75 48, 70 54, 60 56 L60 46 C60 38, 56 32, 50 32 C44 32, 40 38, 40 46 L40 56 C30 54, 25 48, 25 40 C25 28, 36 20, 50 20 Z" 
            fillRule="evenodd"/>
      {/* Small accent dot */}
      <circle cx="50" cy="90" r="3" opacity="0.8"/>
    </svg>
  );
}


export function Logo() {
  // Displays the Syntra logo and name.
  // School-specific logo/name is handled in AppShell based on context.
  return (
    <div className="flex items-center gap-2 p-2">
      <AppLogoIcon className="h-8 w-8 text-sidebar-primary group-data-[collapsible=icon]:h-6 group-data-[collapsible=icon]:w-6" />
      <h1 className="text-xl font-bold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
        Syntra
      </h1>
    </div>
  );
}
