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
import { UserPlus, Edit, Trash2, Loader2, ShieldAlert, ClipboardCopy } from "lucide-react";
import { getUsers, adminCreateUserProfile, adminUpdateUserProfile, type User, AdminUserFormSchema, type AdminUserFormData } from '@/services/user';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { format } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FormField, FormMessage } from '@/components/ui/form';

export default function UsersPage() {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const { toast } = useToast();
  const [createdUserId, setCreatedUserId] = useState<string | null>(null);

  const form = useForm<AdminUserFormData>({
    resolver: zodResolver(AdminUserFormSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "student",
      schoolId: currentUser?.role === 'school_admin' ? currentUser.schoolId : undefined,
    },
  });

  useEffect(() => {
    if (currentUser?.role === 'superadmin' || currentUser?.role === 'school_admin') {
      fetchUsers();
    } else {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (editingUser) {
      form.reset({
        id: editingUser.id,
        name: editingUser.name,
        email: editingUser.email || '',
        role: editingUser.role as 'student' | 'teacher' | 'school_admin',
        schoolId: editingUser.schoolId,
      });
    } else {
      form.reset({
        name: "",
        email: "",
        role: "student",
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
    setCreatedUserId(null);
    setIsEditDialogOpen(true);
  };

  const handleAddNewClick = () => {
    setEditingUser(null);
    setCreatedUserId(null);
    setIsEditDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setEditingUser(null);
      setCreatedUserId(null);
      form.reset({
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

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: "User ID Copied!", description: "You can now use this as the UID when creating the Firebase Auth user." });
    }).catch(err => {
      toast({ title: "Copy failed", description: "Could not copy User ID.", variant: "destructive" });
      console.error('Failed to copy text: ', err);
    });
  };

  async function onSubmit(values: AdminUserFormData) {
    if (!currentUser) return;
    setIsSubmitting(true);
    setCreatedUserId(null);

    try {
      let resultUser: User;
      if (editingUser) {
        if (!editingUser.id) throw new Error("Editing user ID is missing.");
        resultUser = await adminUpdateUserProfile(editingUser.id, values, currentUser.role, currentUser.schoolId);
        toast({ title: "User Updated", description: `${resultUser.name}'s profile has been updated.` });
        fetchUsers();
        handleDialogClose(false);
      } else {
        const dataToSend = { ...values };
        if (currentUser.role === 'school_admin' && !dataToSend.schoolId) {
          dataToSend.schoolId = currentUser.schoolId;
        }
        resultUser = await adminCreateUserProfile(dataToSend, currentUser.role, currentUser.schoolId);
        setCreatedUserId(resultUser.id);
        toast({
          title: "Firestore Profile Created!",
          description: `Profile for ${resultUser.name} created. Now create the Firebase Auth user.`,
          duration: 5000
        });
        fetchUsers();
      }
    } catch (error: any) {
      console.error("Error submitting user form:", error);
      toast({
        title: editingUser ? "Update Failed" : "Creation Failed",
        description: error.message || "An unknown error occurred.",
        variant: "destructive",
        duration: 7000
      });
    } finally {
      setIsSubmitting(false);
      if (editingUser || (!editingUser && !createdUserId && !isSubmitting)) {
        handleDialogClose(false);
      }
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
      <>
        <PageHeader title="User Management" description="You do not have permission to manage users." />
        <Card className="mt-6">
          <CardContent className="pt-6 text-center text-muted-foreground">
            <ShieldAlert className="h-12 w-12 mx-auto text-destructive mb-2" />
            Access Denied. You do not have the necessary permissions to view this page.
          </CardContent>
        </Card>
      </>
    );
  }

  const allowedRoles = currentUser.role === 'superadmin'
    ? ['student', 'teacher', 'school_admin']
    : ['student', 'teacher'];

  return (
    <div className="container mx-auto px-4">
      <PageHeader
        title="User Management"
        description={currentUser.role === 'superadmin' ? "Administer all user accounts." : `Manage users for ${currentUser.schoolName || 'your school'}.`}
        actions={
          <Button onClick={handleAddNewClick}>
            <UserPlus className="mr-2 h-4 w-4" /> Add New User Profile
          </Button>
        }
      />

      <Dialog open={isEditDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-[425px]" aria-describedby="dialog-description">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit User Profile' : 'Add New User Profile'}</DialogTitle>
            <DialogDescription id="dialog-description">
              {editingUser ? `Update ${editingUser.name}'s profile.` : "Create a new user profile in Firestore."}
            </DialogDescription>
          </DialogHeader>

          {!editingUser && createdUserId && (
            <Alert variant="default" className="mt-4 bg-green-100 border-green-300 dark:bg-green-900 dark:border-green-700">
              <ShieldAlert className="h-4 w-4 text-green-700 dark:text-green-300" />
              <AlertTitle className="text-green-800 dark:text-green-200">Success & Next Step</AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-300 space-y-2">
                <p>Firestore profile created successfully!</p>
                <div className="flex items-center gap-2 mt-1 p-1 bg-muted rounded">
                  <code className="font-mono text-sm text-primary flex-grow">{createdUserId}</code>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(createdUserId)}
                    title="Copy User ID"
                    className="px-2"
                  >
                    <ClipboardCopy className="h-4 w-4" />
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {(!createdUserId || editingUser) && (
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
              {!editingUser && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">Email</Label>
                  <Input id="email" {...form.register("email")} className="col-span-3" placeholder="user@example.com" type="email" />
                  {form.formState.errors.email && (
                    <span className="col-start-2 col-span-3 text-sm text-destructive">
                      {form.formState.errors.email.message}
                    </span>
                  )}
                </div>
              )}
              
              {editingUser && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email-display" className="text-right">Email</Label>
                  <Input id="email-display" value={editingUser.email || ''} className="col-span-3 bg-muted" readOnly disabled />
                </div>
              )}

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input id="name" {...form.register("name")} className="col-span-3" placeholder="Full Name" />
                {form.formState.errors.name && (
                  <span className="col-start-2 col-span-3 text-sm text-destructive">
                    {form.formState.errors.name.message}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">Role</Label>
                <Controller
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value} disabled={editingUser?.id === 'superadmin'}>
                      <SelectTrigger id="role" className="col-span-3">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {allowedRoles.map(roleOption => (
                          <SelectItem
                            key={roleOption}
                            value={roleOption}
                            disabled={roleOption === 'school_admin' && currentUser?.role === 'school_admin' && !editingUser}
                          >
                            {roleOption.charAt(0).toUpperCase() + roleOption.slice(1).replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              {currentUser.role === 'superadmin' && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="schoolId" className="text-right">School ID</Label>
                  <Input
                    id="schoolId"
                    {...form.register("schoolId")}
                    className="col-span-3"
                    placeholder="Enter School ID"
                    disabled={form.watch("role") === 'superadmin'}
                  />
                </div>
              )}

              {currentUser.role === 'school_admin' && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="schoolId-display" className="text-right">School</Label>
                  <Input
                    id="schoolId-display"
                    value={currentUser.schoolName ? `${currentUser.schoolName} (${currentUser.schoolId})` : currentUser.schoolId || 'N/A'}
                    className="col-span-3 bg-muted"
                    readOnly
                    disabled
                  />
                </div>
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
          )}
        </DialogContent>
      </Dialog>

      {users.length === 0 && !isLoading ? (
        <Card className="mt-6">
          <CardContent className="pt-6 text-center text-muted-foreground">
            No users found{currentUser?.role === 'school_admin' ? ` for ${currentUser.schoolName}` : ''}.
          </CardContent>
        </Card>
      ) : (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>User List</CardTitle>
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
                  <TableHead>User ID</TableHead>
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
                    <TableCell>{user.schoolName || (user.role === 'superadmin' ? 'N/A' : (user.schoolId ? `ID: ${user.schoolId}` : 'N/A'))}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {user.id}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-1 h-5 w-5"
                        onClick={() => copyToClipboard(user.id)}
                        title="Copy User ID"
                      >
                        <ClipboardCopy className="h-3 w-3"/>
                      </Button>
                    </TableCell>
                    <TableCell>{user.createdAt ? format(new Date(user.createdAt), 'PP') : 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditClick(user)}
                        disabled={user.id === 'superadmin' && currentUser?.id !== 'superadmin'}
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
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