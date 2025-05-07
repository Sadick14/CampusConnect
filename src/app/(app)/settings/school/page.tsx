
'use client';

import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, Loader2, Upload, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { getSchoolById, updateSchoolProfile, UpdateSchoolProfileSchema, type UpdateSchoolProfileData, type School } from '@/services/school';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';

export default function SchoolSettingsPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [schoolData, setSchoolData] = useState<School | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<UpdateSchoolProfileData>({
    resolver: zodResolver(UpdateSchoolProfileSchema),
    defaultValues: {
      name: '',
      address: '',
      phone: '',
      website: '',
    },
  });

  useEffect(() => {
    const fetchSchoolData = async () => {
      if (authLoading || !currentUser || currentUser.role !== 'school_admin' || !currentUser.schoolId) {
        if (!authLoading) setIsFetching(false); // Stop fetching if auth is loaded but user invalid
        return;
      }

      setIsFetching(true);
      try {
        const data = await getSchoolById(currentUser.schoolId);
        setSchoolData(data);
        if (data) {
          form.reset({
            name: data.name || '',
            address: data.address || '',
            phone: data.phone || '',
            website: data.website || '',
          });
          if (data.logoUrl) {
            setLogoPreview(data.logoUrl);
          }
        }
      } catch (error) {
        console.error('Error fetching school data:', error);
        toast({ title: 'Error', description: 'Could not load school data.', variant: 'destructive' });
      } finally {
        setIsFetching(false);
      }
    };

    fetchSchoolData();
  }, [currentUser, authLoading, form, toast]);

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setLogoFile(null);
      setLogoPreview(schoolData?.logoUrl ?? null); // Revert to saved logo or null
    }
  };

  async function onSubmit(values: UpdateSchoolProfileData) {
    if (!currentUser || !currentUser.schoolId) return;

    setIsLoading(true);
    try {
      const updatedSchool = await updateSchoolProfile(
        currentUser.schoolId,
        values,
        logoFile, // Pass the selected file
        currentUser.id // Pass the admin's UID for verification
      );
      setSchoolData(updatedSchool); // Update local state
      if (updatedSchool.logoUrl) setLogoPreview(updatedSchool.logoUrl); // Update preview with potentially new URL
      setLogoFile(null); // Clear the file state after upload
      toast({
        title: 'School Profile Updated',
        description: 'Your school information has been saved successfully.',
      });
      // Optionally refetch user in auth context if school name changed?
      // await refreshUserProfile(); // Need to implement this in AuthContext if needed
    } catch (error) {
      console.error('Error updating school profile:', error);
      toast({
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Could not update school profile.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  // --- Access Control ---
  if (authLoading || isFetching) {
    return (
      <div>
        <PageHeader title="School Profile Settings" description="Loading school information..." />
        <Card className="w-full max-w-3xl mx-auto shadow-lg">
          <CardHeader>
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-3/4 mt-1" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
             <Skeleton className="h-10 w-24" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentUser || currentUser.role !== 'school_admin') {
    return (
      <div>
        <PageHeader title="Access Denied" description="You do not have permission to view this page." />
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            Only School Administrators can manage school settings.
          </CardContent>
        </Card>
      </div>
    );
  }
  
   if (!schoolData) {
     return (
       <div>
         <PageHeader title="Error" description="Could not load school data." />
         <Card>
           <CardContent className="pt-6 text-center text-destructive">
             Failed to fetch school information. Please try again later or contact support.
           </CardContent>
         </Card>
       </div>
     );
   }


  return (
    <div>
      <PageHeader
        title="School Profile Settings"
        description={`Manage the profile and branding for ${schoolData?.name || 'your school'}.`}
      />
      <Card className="w-full max-w-3xl mx-auto shadow-lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Building className="h-5 w-5" /> School Information
              </CardTitle>
              <CardDescription>
                Update your school's contact details and branding.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Name field - could be read-only depending on requirements */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>School Name</FormLabel>
                    <FormControl>
                      <Input placeholder="School Name" {...field} />
                    </FormControl>
                     <FormDescription>The official name of the school.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 123 School Lane, City, Country" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="e.g., +1 234 567 8900" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input type="url" placeholder="e.g., https://www.yourschool.edu" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Logo Upload */}
              <FormItem>
                <FormLabel>School Logo</FormLabel>
                <div className="flex items-center gap-4">
                   <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border bg-muted flex items-center justify-center">
                      {logoPreview ? (
                        <Image src={logoPreview} alt="School Logo Preview" layout="fill" objectFit="contain" />
                      ) : (
                        <ImageIcon className="h-10 w-10 text-muted-foreground" />
                      )}
                    </div>
                  <FormControl>
                    <div className="flex-grow">
                     <Input
                        id="logo"
                        type="file"
                        accept="image/png, image/jpeg, image/gif, image/webp"
                        onChange={handleLogoChange}
                        className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                     />
                       <FormDescription className="mt-1">
                        Upload a logo (PNG, JPG, GIF, WEBP). Max 2MB recommended.
                       </FormDescription>
                    </div>
                  </FormControl>
                </div>
                 <FormMessage /> {/* Display potential errors for the logo field if needed */}
              </FormItem>

            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading || isFetching} className="w-full sm:w-auto">
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Building className="mr-2 h-4 w-4" />
                )}
                Save Changes
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
