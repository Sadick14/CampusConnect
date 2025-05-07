
import { getSchoolById, type School } from '@/services/school';
import { notFound } from 'next/navigation';
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SchoolCommunication from "@/app/(app)/schools/components/school-communication";

interface SchoolDetailPageProps {
  params: { id: string };
}

export default async function SchoolDetailPage({ params }: SchoolDetailPageProps) {
  const { id } = params;
  const school: School | null = await getSchoolById(id);

  if (!school) {
    notFound();
  }

  return (
    <div>
      <PageHeader
        title={school.name}
        description={`Manage ${school.name}'s details and communications.`}
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-primary">School Details</CardTitle>
          </CardHeader>
          <CardContent>
            <p>License Key: {school.licenseKey}</p>
            <p>Admin Email: {school.adminEmail}</p>
            <p>Date Registered: {school.createdAt}</p>
          </CardContent>
        </Card>
        <SchoolCommunication schoolId={school.id} />
      </div>
    </div>
  );
}
