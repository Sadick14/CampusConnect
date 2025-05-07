
import { Suspense } from 'react';
import { getSchoolById, type School } from '@/services/school';
import { notFound } from 'next/navigation';
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import SchoolCommunication from "@/components/schools/school-communication"; // Updated path
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';
import { getStudentsWithContacts, type StudentWithContact } from '@/services/user'; // Import function to get students

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
                 {/* Add skeletons for new fields */}
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-20 w-20" />
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
  // Fetch school details and student contacts concurrently
  const [school, students] = await Promise.all([
      getSchoolById(schoolId),
      getStudentsWithContacts(schoolId) // Fetch students with contact info
  ]).catch(error => {
       console.error("Error fetching school details or students:", error);
       // Handle specific errors if needed, otherwise return nulls
       return [null, [] as StudentWithContact[]];
  });


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
             {school.logoUrl && (
                <div className="mt-4 flex justify-center">
                 <img src={school.logoUrl} alt={`${school.name} Logo`} className="h-24 w-auto object-contain rounded-md border p-1" />
                </div>
             )}
          </CardHeader>
          <CardContent className="space-y-2">
             <p><strong className="font-medium text-muted-foreground">Name:</strong> {school.name}</p>
             <p><strong className="font-medium text-muted-foreground">Address:</strong> {school.address || 'Not Set'}</p>
             <p><strong className="font-medium text-muted-foreground">Phone:</strong> {school.phone || 'Not Set'}</p>
             <p><strong className="font-medium text-muted-foreground">Website:</strong> {school.website ? <a href={school.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{school.website}</a> : 'Not Set'}</p>
            <p><strong className="font-medium text-muted-foreground">License Key:</strong> {school.licenseKey}</p>
            <p><strong className="font-medium text-muted-foreground">Admin Email:</strong> {school.adminEmail}</p>
            <p><strong className="font-medium text-muted-foreground">Admin User ID:</strong> {school.adminUid || 'Not Set'}</p>
            <p><strong className="font-medium text-muted-foreground">Date Registered:</strong> {school.createdAt ? new Date(school.createdAt).toLocaleDateString() : 'N/A'}</p>
            <p><strong className="font-medium text-muted-foreground">Last Updated:</strong> {school.updatedAt ? new Date(school.updatedAt).toLocaleDateString() : 'N/A'}</p>
          </CardContent>
        </Card>
        {/* Pass schoolId and student data to the communication component */}
        <SchoolCommunication schoolId={school.id} students={students} />
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
