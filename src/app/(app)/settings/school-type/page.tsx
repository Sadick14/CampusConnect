'use client';

import { SchoolTypeSetup } from '@/components/admin/school-type-setup';

export default function SchoolTypeSettingsPage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">School Type Configuration</h1>
        <p className="text-muted-foreground mt-2">
          Configure your school types and automatically set up classes and subjects
        </p>
      </div>

      <SchoolTypeSetup />
    </div>
  );
}
