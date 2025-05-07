'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Edit, Trash2, Loader2 } from "lucide-react";
import { getUsers, adminCreateUserProfile, adminUpdateUserProfile, type User, AdminUserFormSchema, type AdminUserFormData } from '@/services/user';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { format } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';


export default function UsersPage() {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const { toast } = useToast();

  const form = useForm<AdminUserFormData>({
    resolver: zodResolver(AdminUserFormSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "student", // Default role for new user form
      schoolId: currentUser?.role === 'school_admin' ? currentUser.schoolId : undefined,
    },
  });

 useEffect(() => {
    if (currentUser?.role === 'superadmin' || currentUser?.role === 'school_admin') {
        fetchUsers();
    } else {
        setIsLoading(false); // Not allowed to view
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  useEffect(() => {
    if (editingUser) {
      form.reset({
        id: editingUser.id,
        name: editingUser.name,
        email: editingUser.email || '',
        role: editingUser.role as 'student' | 'teacher' | 'school_admin', // Cast assumes valid roles are stored
        schoolId: editingUser.schoolId,
      });
    } else {
      form.reset({ // Reset to default for new user
          name: "",
          email: "",
          role: "student",
          // Set schoolId if current user is school_admin, otherwise leave undefined for superadmin to select
          schoolId: currentUser?.role === 'school_admin' ? currentUser.schoolId : undefined,
      });
    }
  }, [editingUser, form, currentUser]);


  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const fetchedUsers = await getUsers(currentUser?.role === 'school_admin' ? currentUser.schoolId : undefined);
      setUsers(fetchedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({ title: "Error", description: "Could not fetch users.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

 const handleEditClick = (user: User) => {
    setEditingUser(user);
    setIsEditDialogOpen(true);
  };

 const handleDialogClose = (open: boolean) => {
    if (!open) {
      setEditingUser(null); // Clear editing state when dialog closes
      form.reset({ // Reset form to defaults based on current user role
        name: "",
        email: "",
        role: "student",
        schoolId: currentUser?.role === 'school_admin' ? currentUser.schoolId : undefined,
      });
      setIsEditDialogOpen(false);
    } else {
       setIsEditDialogOpen(true);
    }
  };

  async function onSubmit(values: AdminUserFormData) {
    if (!currentUser) return;
    setIsSubmitting(true);

    try {
      let resultUser: User;
      if (editingUser) {
         if (!editingUser.id) throw new Error("Editing user ID is missing.");
         console.log("Updating user:", editingUser.id, values)
         resultUser = await adminUpdateUserProfile(editingUser.id, values, currentUser.role, currentUser.schoolId);
         toast({ title: "User Updated", description: `${resultUser.name}'s profile has been updated.` });
      } else {
         const dataToSend = { ...values };
         if (currentUser.role === 'school_admin' && !dataToSend.schoolId) {
            dataToSend.schoolId = currentUser.schoolId;
         }
         console.log("Creating user profile:", dataToSend)
         resultUser = await adminCreateUserProfile(dataToSend, currentUser.role, currentUser.schoolId);
         toast({ 
            title: "Firestore Profile Created!", 
            description: (
                 <div className="space-y-2">
                    <p>{`${resultUser.name}'s Firestore profile created successfully.`}</p>
                    <p className="font-semibold text-destructive">
                        NEXT STEP: Manually create Firebase Authentication user:
                    </p>
                    <ul className="list-disc list-inside pl-4 text-sm bg-muted p-2 rounded">
                        <li>Email: <strong className="font-mono">{resultUser.email}</strong></li>
                        <li>UID: <strong className="font-mono text-primary">{resultUser.id}</strong> (Use this Firestore ID as Auth UID)</li>
                    </ul>
                    <p className="text-xs text-muted-foreground">This ensures the login links to this profile and role.</p>
                </div>
            ),
             duration: 15000 
         });
      }
      fetchUsers(); 
      handleDialogClose(false); 
    } catch (error: any) {
      console.error("Error submitting user form:", error);
      toast({ 
        title: editingUser ? "Update Failed" : "Creation Failed", 
        description: error.message || "An unknown error occurred.", 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  }


  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser || (currentUser.role !== 'superadmin' && currentUser.role !== 'school_admin')) {
    return (
      <div>
        <PageHeader title="User Management" description="You do not have permission to manage users." />
         <Card className="mt-6">
            <CardContent className="pt-6 text-center text-muted-foreground">
                <ShieldAlert className="h-12 w-12 mx-auto text-destructive mb-2" />
                Access Denied. You do not have the necessary permissions to view this page.
            </CardContent>
        </Card>
      </div>
    );
  }

  const allowedRoles = currentUser.role === 'superadmin' 
      ? ['student', 'teacher', 'school_admin'] 
      : ['student', 'teacher']; 

  return (
    <div>
      <PageHeader
        title="User Management"
        description={currentUser.role === 'superadmin' ? "Administer all user accounts." : `Manage users for ${currentUser.schoolName || 'your school'}.`}
        actions={
          <Dialog open={isEditDialogOpen} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingUser(null)}> 
                <UserPlus className="mr-2 h-4 w-4" /> Add New User Profile
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingUser ? 'Edit User Profile' : 'Add New User Profile'}</DialogTitle>
                <DialogDescription>
                  {editingUser ? `Update ${editingUser.name}'s profile.` : "Create a new user profile in Firestore. Remember to create the Firebase Auth user manually afterwards."}
                </DialogDescription>
              </DialogHeader>
                 {!editingUser && (
                     <Alert variant="destructive" className="mt-4">
                       <ShieldAlert className="h-4 w-4" />
                       <AlertTitle>Manual Firebase Auth Step Required</AlertTitle>
                       <AlertDescription>
                           After saving this profile, you <strong className="font-bold">MUST MANUALLY CREATE</strong> the corresponding Firebase Authentication user in the Firebase Console.
                           Use the <strong className="font-bold">email specified below</strong> and set their <strong className="font-bold text-primary">User UID to the Firestore Document ID</strong> that will be shown in the success message/toast.
                       </AlertDescription>
                     </Alert>
                )}
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                 {!editingUser && (
                     <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email" className="text-right">Email</Label>
                            <Input id="email" {...field} className="col-span-3" placeholder="user@example.com" type="email" />
                            <span className="col-start-2 col-span-3"><FormMessage /></span>
                        </div>
                        )}
                    />
                 )}
                 {editingUser && (
                     <div className="grid grid-cols-4 items-center gap-4">
                         <Label htmlFor="email-display" className="text-right">Email</Label>
                         <Input id="email-display" value={editingUser.email || ''} className="col-span-3 bg-muted" readOnly disabled />
                     </div>
                 )}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">Name</Label>
                      <Input id="name" {...field} className="col-span-3" placeholder="Full Name" />
                       <span className="col-start-2 col-span-3"><FormMessage /></span>
                    </div>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                     <div className="grid grid-cols-4 items-center gap-4">
                       <Label htmlFor="role" className="text-right">Role</Label>
                        <Controller
                            control={form.control}
                            name="role"
                            render={({ field: controllerField, fieldState }) => (
                            <Select 
                                onValueChange={controllerField.onChange} 
                                value={controllerField.value}
                                // Superadmin cannot have their role changed here.
                                // School admin cannot change their own role or other school admins.
                                disabled={(editingUser?.id === 'superadmin') || (editingUser?.role === 'superadmin' && currentUser?.role !== 'superadmin') || (currentUser?.role === 'school_admin' && editingUser?.role === 'school_admin')}
                            >
                                <SelectTrigger id="role" className="col-span-3">
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                {allowedRoles.map(roleOption => (
                                    <SelectItem 
                                      key={roleOption} 
                                      value={roleOption} 
                                      // Prevent school admin from creating another school admin
                                      disabled={roleOption === 'school_admin' && currentUser?.role === 'school_admin' && !editingUser}
                                    >
                                        {roleOption.charAt(0).toUpperCase() + roleOption.slice(1).replace('_', ' ')}
                                    </SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                            )}
                        />
                        <span className="col-start-2 col-span-3"><FormMessage /></span>
                    </div>
                  )}
                />
                {currentUser.role === 'superadmin' && (
                    <FormField
                    control={form.control}
                    name="schoolId"
                    render={({ field }) => (
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="schoolId" className="text-right">School</Label>
                            <Input 
                                id="schoolId" 
                                {...field} 
                                value={field.value || ""} // Ensure controlled component has a string value
                                className="col-span-3" 
                                placeholder="Enter School ID (if applicable)" 
                                // Superadmin role should not be tied to a school.
                                // Disable if the role being set or edited to is 'superadmin'.
                                // Also disable if current form value for role is superadmin
                                disabled={form.getValues('role') === 'superadmin' || (editingUser?.role === 'superadmin' && editingUser.id === 'superadmin')}
                             />
                             <span className="col-start-2 col-span-3"><FormMessage /></span>
                        </div>
                    )}
                    />
                )}
                <DialogFooter>
                     <DialogClose asChild>
                        <Button type="button" variant="outline">Cancel</Button>
                    </DialogClose>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (editingUser ? 'Save Changes' : 'Create Profile')}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {users.length === 0 && !isLoading ? (
         <Card className="mt-6">
             <CardContent className="pt-6 text-center text-muted-foreground">
                 No users found{currentUser?.role === 'school_admin' ? ` for ${currentUser.schoolName}` : ''}.
             </CardContent>
         </Card>
      ) : (
        <Card className="mt-6 shadow-lg">
          <CardHeader>
            <CardTitle className="text-primary">User List</CardTitle>
            <CardDescription>
                {currentUser?.role === 'superadmin' ? 'All users in the system.' : `Users associated with ${currentUser.schoolName || 'your school'}.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>School</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.role.charAt(0).toUpperCase() + user.role.slice(1).replace('_', ' ')}</TableCell>
                    <TableCell>{user.schoolName || (user.role === 'superadmin' ? 'N/A (Global)' : 'N/A')}</TableCell>
                    <TableCell>{user.createdAt ? format(new Date(user.createdAt), 'PP') : 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleEditClick(user)}
                        // Only superadmin can edit the primary 'superadmin' UID profile.
                        // Other superadmin profiles (if any, not typical) can be edited by other superadmins.
                        disabled={user.id === 'superadmin' && currentUser?.id !== 'superadmin'}
                       >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                       {/* Optional: Add Delete Button (with confirmation) - Be very careful with this!
                       <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive hover:text-destructive/80" 
                          disabled={user.id === 'superadmin'} // Cannot delete primary superadmin
                          onClick={() => { /* Implement delete confirmation and logic *\/ }}
                        >
                          <Trash2 className="h-4 w-4" />
                           <span className="sr-only">Delete</span>
                       </Button> */}
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
