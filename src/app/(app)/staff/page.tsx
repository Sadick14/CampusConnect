
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { ListPageSkeleton } from '@/components/common/page-skeletons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { getSchoolStaff, createStaff as createStaffSvc, updateStaff as updateStaffSvc, deleteStaff as deleteStaffSvc } from '@/services/staff';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageHeader } from '@/components/common/page-header';
import {
  Plus,
  Edit,
  Trash2,
  UserCheck,
  Mail,
  Phone,
  MoreVertical,
  Loader2,
  Briefcase,
  GraduationCap,
} from 'lucide-react';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'teacher' | 'admin' | 'support_staff' | 'librarian' | 'counselor';
  department?: string;
  subjects?: string[];
  qualification?: string;
  experience?: number;
  salary?: number;
  isActive: boolean;
  organizationId: string;
  schoolId?: string; // Deprecated
  createdAt: Date;
  updatedAt: Date;
}

const STAFF_ROLES = [
  { value: 'teacher', label: 'Teacher' },
  { value: 'admin', label: 'Administrator' },
  { value: 'support_staff', label: 'Support Staff' },
  { value: 'librarian', label: 'Librarian' },
  { value: 'counselor', label: 'Counselor' },
];

const DEPARTMENTS = [
  'Mathematics',
  'English',
  'Science',
  'Social Studies',
  'Arts',
  'Physical Education',
  'Administration',
  'Support Services',
];

const SUBJECTS = [
  'Mathematics',
  'English Language',
  'Integrated Science',
  'Social Studies',
  'Religious and Moral Education',
  'Information and Communication Technology',
  'French',
  'Ghanaian Language',
  'Creative Arts',
  'Physical Education',
];

export default function StaffPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  // form state
  const [fName, setFName] = useState('');
  const [fEmail, setFEmail] = useState('');
  const [fPhone, setFPhone] = useState('');
  const [fRole, setFRole] = useState<StaffMember['role'] | ''>('');
  const [fDepartment, setFDepartment] = useState('');
  const [fQualification, setFQualification] = useState('');
  const [fExperience, setFExperience] = useState<number | undefined>(undefined);
  const [fSalary, setFSalary] = useState<number | undefined>(undefined);

  useEffect(() => {
    async function load() {
      if (!currentUser?.currentOrganizationId) return;
      setLoading(true);
      try {
        const staffList = await getSchoolStaff(currentUser.currentOrganizationId);
        setStaff(
          staffList.map((s) => ({
            ...s,
            createdAt: new Date(),
            updatedAt: new Date(),
          })) as any
        );
      } catch (e) {
        console.error(e);
        toast({ title: 'Error', description: 'Failed to load staff', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [currentUser?.currentOrganizationId, toast]);

  const resetForm = () => {
    setFName('');
    setFEmail('');
    setFPhone('');
    setFRole('');
    setFDepartment('');
    setFQualification('');
    setFExperience(undefined);
    setFSalary(undefined);
  };

  const handleCreateStaff = async () => {
    if (!currentUser?.currentOrganizationId) return;
    try {
      const created = await createStaffSvc({
        organizationId: currentUser.currentOrganizationId,
        name: fName,
        email: fEmail,
        phone: fPhone || null,
        role: (fRole as any) || 'teacher',
        department: fDepartment || null,
        subjects: [],
        qualification: fQualification || null,
        experience: fExperience ?? null,
        salary: fSalary ?? null,
        isActive: true,
      } as any);
      setStaff((prev) => [
        ...prev,
        {
          ...(created as any),
          createdAt: new Date(),
          updatedAt: new Date(),
        } as StaffMember,
      ]);
      toast({ title: 'Success', description: 'Staff member created successfully' });
      setCreateDialogOpen(false);
      resetForm();
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Error', description: e.message || 'Failed to create staff', variant: 'destructive' });
    }
  };

  const handleEditStaff = async () => {
    if (!selectedStaff) return;
    try {
      const updates: any = {};
      if (fName) updates.name = fName;
      if (fEmail) updates.email = fEmail;
      if (fPhone) updates.phone = fPhone;
      if (fRole) updates.role = fRole;
      if (fDepartment) updates.department = fDepartment;
      if (fQualification) updates.qualification = fQualification;
      if (fExperience !== undefined) updates.experience = fExperience;
      if (fSalary !== undefined) updates.salary = fSalary;
      await updateStaffSvc(selectedStaff.id, updates);
      setStaff((prev) => prev.map((s) => (s.id === selectedStaff.id ? { ...s, ...updates } : s)));
      toast({ title: 'Success', description: 'Staff member updated successfully' });
      setEditDialogOpen(false);
      setSelectedStaff(null);
      resetForm();
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Error', description: e.message || 'Failed to update staff', variant: 'destructive' });
    }
  };

  const handleDeleteStaff = async () => {
    if (!selectedStaff) return;
    try {
      await deleteStaffSvc(selectedStaff.id);
      setStaff((prev) => prev.filter((s) => s.id !== selectedStaff.id));
      toast({ title: 'Success', description: 'Staff member deleted successfully' });
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Error', description: e.message || 'Failed to delete staff', variant: 'destructive' });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedStaff(null);
    }
  };

  const openEditDialog = (staffMember: StaffMember) => {
    setSelectedStaff(staffMember);
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (staffMember: StaffMember) => {
    setSelectedStaff(staffMember);
    setDeleteDialogOpen(true);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'teacher':
        return 'bg-blue-100 text-blue-800';
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'support_staff':
        return 'bg-green-100 text-green-800';
      case 'librarian':
        return 'bg-yellow-100 text-yellow-800';
      case 'counselor':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <ListPageSkeleton />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Staff Management"
        description="Oversee staff profiles, roles, and assignments."
        actions={
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add New Staff
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Staff Member</DialogTitle>
                <DialogDescription>
                  Create a new staff profile with role and department assignments.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" placeholder="Enter full name" value={fName} onChange={(e)=>setFName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="Enter email" value={fEmail} onChange={(e)=>setFEmail(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone (Optional)</Label>
                    <Input id="phone" placeholder="Enter phone number" value={fPhone} onChange={(e)=>setFPhone(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={fRole} onValueChange={(v)=>setFRole(v as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {STAFF_ROLES.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Select value={fDepartment} onValueChange={setFDepartment}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEPARTMENTS.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="qualification">Qualification</Label>
                    <Input id="qualification" placeholder="Enter qualification" value={fQualification} onChange={(e)=>setFQualification(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="experience">Years of Experience</Label>
                    <Input id="experience" type="number" placeholder="0" value={fExperience ?? ''} onChange={(e)=>setFExperience(e.target.value ? parseInt(e.target.value) : undefined)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salary">Monthly Salary (GHS)</Label>
                    <Input id="salary" type="number" placeholder="0" value={fSalary ?? ''} onChange={(e)=>setFSalary(e.target.value ? parseFloat(e.target.value) : undefined)} />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateStaff}>Create Staff Member</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Staff
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staff.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Teachers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {staff.filter(s => s.role === 'teacher').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Classroom teachers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Administrators
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {staff.filter(s => s.role === 'admin').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Admin staff
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Support Staff
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {staff.filter(s => s.role !== 'teacher' && s.role !== 'admin').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Support roles
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Staff Table */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Directory</CardTitle>
          <CardDescription>
            All staff members and their roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Subjects</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No staff members found. Add your first staff member to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  staff.map((member) => (
                    <TableRow key={member.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell>
                        <Badge className={getRoleBadgeColor(member.role)}>
                          {member.role.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>{member.department || 'N/A'}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3" />
                            {member.email}
                          </div>
                          {member.phone && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {member.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {member.subjects && member.subjects.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {member.subjects.slice(0, 2).map((subject, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {subject}
                              </Badge>
                            ))}
                            {member.subjects.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{member.subjects.length - 2}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={member.isActive ? 'default' : 'secondary'}>
                          {member.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(member)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Staff
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Briefcase className="h-4 w-4 mr-2" />
                              View Schedule
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <GraduationCap className="h-4 w-4 mr-2" />
                              Assign Classes
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openDeleteDialog(member)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Staff
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Staff Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
            <DialogDescription>
              Update staff member information and assignments.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Full Name</Label>
                <Input id="edit-name" defaultValue={selectedStaff?.name} value={fName || selectedStaff?.name || ''} onChange={(e)=>setFName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input id="edit-email" type="email" value={fEmail || selectedStaff?.email || ''} onChange={(e)=>setFEmail(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone (Optional)</Label>
                <Input id="edit-phone" value={fPhone || selectedStaff?.phone || ''} onChange={(e)=>setFPhone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">Role</Label>
                <Select defaultValue={selectedStaff?.role} value={fRole || selectedStaff?.role} onValueChange={(v)=>setFRole(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAFF_ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-department">Department</Label>
                <Select defaultValue={selectedStaff?.department} value={fDepartment || selectedStaff?.department} onValueChange={setFDepartment}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-qualification">Qualification</Label>
                <Input id="edit-qualification" value={fQualification || selectedStaff?.qualification || ''} onChange={(e)=>setFQualification(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-experience">Years of Experience</Label>
                <Input id="edit-experience" type="number" value={fExperience ?? selectedStaff?.experience ?? ''} onChange={(e)=>setFExperience(e.target.value ? parseInt(e.target.value) : undefined)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-salary">Monthly Salary (GHS)</Label>
                <Input id="edit-salary" type="number" value={fSalary ?? selectedStaff?.salary ?? ''} onChange={(e)=>setFSalary(e.target.value ? parseFloat(e.target.value) : undefined)} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditStaff}>Update Staff Member</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Staff Member?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete {selectedStaff?.name}? This action cannot be undone and will affect all their assignments and schedules.
          </AlertDialogDescription>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteStaff}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Staff Member
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
