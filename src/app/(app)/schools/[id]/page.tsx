
import { Suspense } from 'react';
import { getSchoolById, type School } from '@/services/school';
import { notFound } from 'next/navigation';
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import SchoolCommunication from "@/app/(app)/schools/components/school-communication";
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

interface SchoolDetailPageProps {
  params: { id: string };
}

// Loading component for the details card
function SchoolDetailsSkeleton() {
    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-primary"><Skeleton className="h-6 w-3/4" /></CardTitle>
                 <CardDescription><Skeleton className="h-4 w-1/2" /></CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-3/4" />
            </CardContent>
        </Card>
    );
}

// Loading component for the communication card (or the whole section)
function CommunicationSkeleton() {
    return (
         <Card className="shadow-lg">
             <CardHeader>
                 <CardTitle className="text-primary flex items-center gap-2"><Skeleton className="h-6 w-1/2" /></CardTitle>
                 <CardDescription><Skeleton className="h-4 w-3/4" /></CardDescription>
             </CardHeader>
              <CardContent className="space-y-4">
                 <Skeleton className="h-10 w-full" />
                 <Skeleton className="h-24 w-full" />
                 <Skeleton className="h-10 w-full" />
              </CardContent>
              <CardFooter>
                 <Skeleton className="h-10 w-24" />
              </CardFooter>
         </Card>
    );
}

async function SchoolDetails({ schoolId }: { schoolId: string }) {
  const school: School | null = await getSchoolById(schoolId);

  if (!school) {
    notFound();
  }

  return (
    <>
      <PageHeader
        title={school.name}
        description={`Manage ${school.name}'s details and communications.`}
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-primary">School Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p><strong className="font-medium">License Key:</strong> {school.licenseKey}</p>
            <p><strong className="font-medium">Admin Email:</strong> {school.adminEmail}</p>
            <p><strong className="font-medium">Admin User ID:</strong> {school.adminUid || 'Not Set'}</p>
            <p><strong className="font-medium">Date Registered:</strong> {school.createdAt ? new Date(school.createdAt).toLocaleDateString() : 'N/A'}</p>
            <p><strong className="font-medium">Last Updated:</strong> {school.updatedAt ? new Date(school.updatedAt).toLocaleDateString() : 'N/A'}</p>

          </CardContent>
        </Card>
        {/* Communication component remains client-side */}
        <SchoolCommunication schoolId={school.id} />
      </div>
    </>
  );
}

export default function SchoolDetailPage({ params }: SchoolDetailPageProps) {
  const { id } = params;

  return (
      <Suspense fallback={
          <div>
              <PageHeader title={<Skeleton className="h-8 w-1/2"/>} description={<Skeleton className="h-4 w-3/4 mt-1"/>} />
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <SchoolDetailsSkeleton />
                  <CommunicationSkeleton />
              </div>
          </div>
      }>
          <SchoolDetails schoolId={id} />
      </Suspense>
  );
}
