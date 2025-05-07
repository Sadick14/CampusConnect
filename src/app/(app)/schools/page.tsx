
'use client'; // Add this directive

import Link from 'next/link';
import { useState, useEffect } from 'react'; // Import hooks
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Building, Loader2 } from "lucide-react"; // Changed School to Building icon, Added Loader2
import { getSchools, type School } from '@/services/school'; // School type import
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/auth-context'; // Import useAuth
import { useToast } from '@/hooks/use-toast'; // Import useToast

export default function SchoolsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser, loading: authLoading } = useAuth(); // Get currentUser and auth loading state
  const { toast } = useToast(); // Get toast function

  useEffect(() => {
    const fetchSchools = async () => {
      if (currentUser?.role === 'superadmin') { // Only superadmin should fetch schools here
        setIsLoading(true);
        try {
          const fetchedSchools = await getSchools();
          setSchools(fetchedSchools);
        } catch (error) {
          console.error("Error fetching schools:", error);
          toast({
            title: "Error Fetching Schools",
            description: error instanceof Error ? error.message : "Could not load schools.",
            variant: "destructive",
          });
          setSchools([]); // Set empty on error
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false); // Don't load if not superadmin
        setSchools([]);
      }
    };

    // Only fetch if auth is done loading and we have a superadmin user
    if (!authLoading && currentUser) {
      fetchSchools();
    } else if (!authLoading && !currentUser) {
        setIsLoading(false); // Stop loading if auth finished and no user
    }

  }, [currentUser, authLoading, toast]); // Depend on currentUser and authLoading


  // Show main loading indicator if either auth or school data is loading
  if (authLoading || isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  // Check if the user is authorized (Superadmin) after loading
  if (!currentUser || currentUser.role !== 'superadmin') {
     return (
        <div>
            <PageHeader
                title="School Management"
                description="You do not have permission to view this page."
            />
            <Card>
                <CardContent className="pt-6">
                    <p>Access denied. Only Super Admins can manage schools.</p>
                </CardContent>
            </Card>
        </div>
     );
  }


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
                    {/* Ensure createdAt is valid before formatting */}
                    <TableCell>{school.createdAt ? format(new Date(school.createdAt), "PPP") : 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/schools/${school.id}`} passHref>
                      <Button variant="outline" size="sm" >Manage</Button>
                      </Link>
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
