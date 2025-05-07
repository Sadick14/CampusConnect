
import Link from 'next/link';
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Building } from "lucide-react"; // Changed School to Building icon to avoid potential naming conflicts
import { getSchools, type School } from '@/services/school'; // School type import
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default async function SchoolsPage() {
  const schools: School[] = await getSchools();

  return (
    <div>
      <PageHeader 
        title="School Management"
        description="Register and manage schools using CampusConnect Pro."
        actions={
          <Link href="/schools/register" passHref>
            <Button><PlusCircle className="mr-2 h-4 w-4" /> Add New School</Button>
          </Link>
        }
      />
      {schools.length === 0 ? (
        <Card className="w-full shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-xl text-primary">No Schools Registered Yet</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center gap-4 py-10 text-center">
            <Building className="h-16 w-16 text-muted-foreground" />
            <p className="text-muted-foreground">
              Start by registering a new school. Click the &quot;Add New School&quot; button above.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-primary">Registered Schools</CardTitle>
            <CardDescription>A list of all schools registered in the system.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>School Name</TableHead>
                  <TableHead>License Key</TableHead>
                  <TableHead>Admin Email</TableHead>
                  <TableHead>Date Registered</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schools.map((school) => (
                  <TableRow key={school.id}>
                    <TableCell className="font-medium">{school.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{school.licenseKey}</Badge>
                    </TableCell>
                     <TableCell>{school.adminEmail || 'N/A'}</TableCell>
                    <TableCell>{format(new Date(school.createdAt), "PPP")}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" disabled>Manage</Button> {/* Placeholder for future actions */}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
