import type { SVGProps } from 'react';

// A simple placeholder SVG logo. Replace with actual logo.
function AppLogoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );
}


export function Logo() {
  return (
    <div className="flex items-center gap-2 p-2">
      <AppLogoIcon className="h-8 w-8 text-sidebar-primary" />
      <h1 className="text-xl font-bold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
        CampusConnect Pro
      </h1>
    </div>
  );
}
