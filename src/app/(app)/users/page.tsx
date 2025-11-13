
'use client';

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { ListPageSkeleton } from '@/components/common/page-skeletons';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Edit, Trash2, Loader2, ShieldAlert, Eye, EyeOff } from "lucide-react"; // Added Eye icons
import { getUsers, adminCreateUserProfile, adminUpdateUserProfile, type User } from '@/services/user';
import { AdminUserFormSchema, type AdminUserFormData } from '@/schemas/user';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { format } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Form, FormField, FormMessage, FormControl, FormLabel, FormItem } from '@/components/ui/form'; // Import Form components

export default function UsersPage() {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false); // State for password visibility
  const { toast } = useToast();
  // Removed createdUserId state as UID is handled by Auth now

  const form = useForm<AdminUserFormData>({
    resolver: zodResolver(AdminUserFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "", // Initialize password
      role: "student",
      organizationId: currentUser?.role === 'school_admin' ? currentUser.currentOrganizationId : undefined,
    },
  });

  useEffect(() => {
    if (currentUser?.role === 'superadmin' || currentUser?.role === 'school_admin' || currentUser?.role === 'organization_owner') {
      fetchUsers();
    } else {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    // Reset form when dialog opens/closes or editingUser changes
    if (isEditDialogOpen) {
        if (editingUser) {
            form.reset({
                id: editingUser.id,
                name: editingUser.name,
                email: editingUser.email || '',
                role: editingUser.role as 'student' | 'teacher' | 'organization_owner' | 'superadmin',
                organizationId: editingUser.currentOrganizationId,
                password: '', // Don't pre-fill password for editing
            });
        } else {
            form.reset({
                name: "",
                email: "",
                password: "",
                role: "student", // Default role for new user
                organizationId: currentUser?.role === 'school_admin' ? currentUser.currentOrganizationId : undefined,
            });
        }
    } else {
         // Optional: Clear form state completely when dialog closes
         form.reset({ name: "", email: "", password: "", role: "student", organizationId: currentUser?.role === 'school_admin' ? currentUser.currentOrganizationId : undefined });
    }
    setShowPassword(false); // Reset password visibility on dialog state change
  }, [editingUser, isEditDialogOpen, form, currentUser]);


  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const fetchedUsers = await getUsers(currentUser?.role === 'school_admin' ? currentUser.currentOrganizationId || undefined : undefined);
      setUsers(fetchedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({ title: "Error", description: error instanceof Error ? error.message : "Could not fetch users.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setIsEditDialogOpen(true);
  };

  const handleAddNewClick = () => {
    setEditingUser(null);
    setIsEditDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    // Manually control the open state based on Radix callback
    setIsEditDialogOpen(open);
    if (!open) {
      setEditingUser(null); // Clear editing state when closing
      // Form reset is handled by useEffect
    }
  };

  // Removed copyToClipboard as UID is not manually handled anymore

  async function onSubmit(values: AdminUserFormData) {
    if (!currentUser) return;
    setIsSubmitting(true);

    try {
      let resultUser: User;
      if (editingUser) {
        // --- Update User ---
        if (!editingUser.id) throw new Error("Editing user ID is missing.");
        // Don't send password for updates
        const { password, ...updateData } = values;
  resultUser = await adminUpdateUserProfile(editingUser.id, updateData, currentUser.role, currentUser.currentOrganizationId);
        toast({ title: "User Updated", description: `${resultUser.name}'s profile has been updated.` });
        fetchUsers(); // Refresh list
        handleDialogClose(false); // Close dialog on success
      } else {
        // --- Create User ---
        if (!values.password) {
            form.setError("password", { type: "manual", message: "Password is required." });
            setIsSubmitting(false);
            return;
        }
        const dataToSend = { ...values };
        if (currentUser.role === 'school_admin' && !dataToSend.organizationId) {
          dataToSend.organizationId = currentUser.currentOrganizationId; // Ensure school admin assigns to their organization
        }
        // Pass the full data including password to adminCreateUserProfile
        resultUser = await adminCreateUserProfile(dataToSend, currentUser.role, currentUser.currentOrganizationId);
        toast({
          title: "User Created Successfully!",
          description: `Auth account and Firestore profile created for ${resultUser.name}.`,
          duration: 7000
        });
        fetchUsers(); // Refresh list
        handleDialogClose(false); // Close dialog on success
      }
    } catch (error: any) {
      console.error("Error submitting user form:", error);
      toast({
        title: editingUser ? "Update Failed" : "Creation Failed",
        description: error.message || "An unknown error occurred.",
        variant: "destructive",
        duration: 7000
      });
      // Keep dialog open on error
    } finally {
      setIsSubmitting(false);
    }
  }


  if (isLoading) {
    return <ListPageSkeleton />;
  }

  if (!currentUser || (currentUser.role !== 'superadmin' && currentUser.role !== 'school_admin' && currentUser.role !== 'organization_owner')) {
    return (
      <div className="container mx-auto px-4">
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
    : ['student', 'teacher']; // School admins cannot create other admins

  return (
    <div className="container mx-auto px-4">
      <PageHeader
        title="User Management"
  description={currentUser.role === 'superadmin' ? "Administer all user accounts." : `Manage users for ${currentUser.currentOrganizationId || 'your organization'}.`}
        actions={
          <Button onClick={handleAddNewClick}>
            <UserPlus className="mr-2 h-4 w-4" /> Add New User
          </Button>
        }
      />

      <Dialog open={isEditDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-[425px]" aria-describedby="dialog-description">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit User Profile' : 'Add New User'}</DialogTitle>
            <DialogDescription id="dialog-description">
              {editingUser
                ? `Update ${editingUser.name}'s profile details. Email and password cannot be changed here.`
                : "Create a new user's authentication account and Firestore profile."}
            </DialogDescription>
          </DialogHeader>

          {/* Removed the success alert for UID copying */}

          <Form {...form}> {/* Wrap form elements */}
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-4 items-center gap-4">
                    <FormLabel className="text-right">Email</FormLabel>
                    <FormControl className="col-span-3">
                       <Input
                          id="email"
                          {...field}
                          placeholder="user@example.com"
                          type="email"
                          readOnly={!!editingUser} // Email is read-only when editing
                          disabled={!!editingUser}
                          className={editingUser ? 'bg-muted cursor-not-allowed' : ''}
                        />
                    </FormControl>
                    <FormMessage className="col-start-2 col-span-3" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-4 items-center gap-4">
                    <FormLabel htmlFor="name" className="text-right">Name</FormLabel>
                    <FormControl className="col-span-3">
                        <Input id="name" {...field} placeholder="Full Name" />
                    </FormControl>
                    <FormMessage className="col-start-2 col-span-3" />
                  </FormItem>
                )}
              />

              {/* Password field only shown when creating a new user */}
              {!editingUser && (
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-4 items-center gap-4">
                      <FormLabel className="text-right">Password</FormLabel>
                       <FormControl className="col-span-3">
                         <div className="relative">
                           <Input
                             type={showPassword ? "text" : "password"}
                             placeholder="Enter password (min 8 chars)"
                             {...field}
                           />
                            <Button
                             type="button"
                             variant="ghost"
                             size="icon"
                             className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                             onClick={() => setShowPassword(!showPassword)}
                             tabIndex={-1}
                           >
                             {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                             <span className="sr-only">{showPassword ? 'Hide password' : 'Show password'}</span>
                           </Button>
                         </div>
                       </FormControl>
                      <FormMessage className="col-start-2 col-span-3" />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-4 items-center gap-4">
                    <FormLabel className="text-right">Role</FormLabel>
                    <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={editingUser?.id === 'superadmin'} // Cannot change superadmin role
                    >
                        <FormControl className="col-span-3">
                          <SelectTrigger id="role">
                              <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                         </FormControl>
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
                    <FormMessage className="col-start-2 col-span-3" />
                  </FormItem>
                 )}
              />

              {/* School ID assignment - Conditional based on admin role */}
               {currentUser.role === 'superadmin' && (
                 <FormField
                   control={form.control}
                   name="organizationId"
                   render={({ field }) => (
                     <FormItem className="grid grid-cols-4 items-center gap-4">
                       <FormLabel htmlFor="organizationId" className="text-right">Organization ID</FormLabel>
                       <FormControl className="col-span-3">
                           <Input
                              id="organizationId"
                              {...field}
                              placeholder="Enter Organization ID (optional)"
                              value={field.value ?? ''}
                              onChange={(e) => field.onChange(e.target.value || null)}
                           />
                       </FormControl>
                       <FormMessage className="col-start-2 col-span-3" />
                     </FormItem>
                   )}
                 />
               )}

               {currentUser.role === 'school_admin' && (
                  <FormItem className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="schoolId-display" className="text-right">School</Label>
                    <Input
                      id="organizationId-display"
                      value={currentUser.currentOrganizationId ? `${currentUser.currentOrganizationId}` : 'N/A'}
                      className="col-span-3 bg-muted"
                      readOnly
                      disabled
                    />
                     {/* Hidden input to ensure organizationId is submitted correctly for organization admins */}
                     <input type="hidden" {...form.register("organizationId")} value={currentUser.currentOrganizationId || ''} />
                   </FormItem>
               )}


              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (editingUser ? 'Save Changes' : 'Create User')}
                </Button>
              </DialogFooter>
            </form>
          </Form> {/* End Form */}

        </DialogContent>
      </Dialog>

      {users.length === 0 && !isLoading ? (
        <Card className="mt-6">
          <CardContent className="pt-6 text-center text-muted-foreground">
            No users found{currentUser?.role === 'school_admin' ? ` for ${currentUser.currentOrganizationId}` : ''}.
          </CardContent>
        </Card>
      ) : (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>User List</CardTitle>
            <CardDescription>
              {currentUser?.role === 'superadmin' ? 'All users in the system.' : `Users associated with ${currentUser.currentOrganizationId || 'your organization'}.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>User ID (Auth UID)</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.role?.charAt(0).toUpperCase() + user.role?.slice(1).replace('_', ' ')}</TableCell>
                    <TableCell>{user.currentOrganizationId || (user.role === 'superadmin' ? 'N/A' : (user.organizationIds && user.organizationIds.length ? `ID: ${user.organizationIds[0]}` : 'N/A'))}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {user.id}
                      {/* Removed copy button for UID */}
                    </TableCell>
                    <TableCell>{user.createdAt ? format(new Date(user.createdAt), 'PP') : 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditClick(user)}
                         // Prevent non-superadmins from editing the superadmin profile
                        disabled={user.id === 'superadmin' && currentUser?.id !== 'superadmin'}
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                       {/* TODO: Add Delete functionality with confirmation */}
                       {/* <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" disabled={user.id === 'superadmin'}>
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
