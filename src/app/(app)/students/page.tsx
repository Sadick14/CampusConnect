
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  UserPlus,
  Search,
  Trash2,
  Eye,
  Edit,
  Loader2,
  AlertCircle,
  Filter,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getStudentsByOrganization, deleteStudent, type Student } from '@/services/student';
import { getUserCurrentOrganization } from '@/services/user-organization';
import Link from 'next/link';

export default function StudentsPage() {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('active');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);

  // Get organization ID from URL params or user's current organization
  const orgIdFromUrl = searchParams.get('org');

  // Fetch students
  useEffect(() => {
    const fetchStudents = async () => {
      if (!currentUser || authLoading) return;

      try {
        setLoading(true);
        
        // Get organization ID from URL or user's current organization
        let orgId = orgIdFromUrl;
        if (!orgId) {
          orgId = await getUserCurrentOrganization(currentUser.id);
        }

        if (!orgId) {
          // No organization found, redirect to organizations page
          router.replace('/organizations');
          return;
        }

        setCurrentOrgId(orgId);
        const data = await getStudentsByOrganization(orgId);
        setStudents(data);
        applyFilters(data, searchTerm, selectedStatus, selectedClass);
      } catch (error) {
        console.error('Error fetching students:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch students',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [currentUser, authLoading, orgIdFromUrl, router, toast]);

  // Apply filters
  const applyFilters = (
    data: Student[],
    search: string,
    status: string,
    classFilter: string
  ) => {
    let filtered = data;

    // Status filter
    if (status) {
      filtered = filtered.filter(s => s.status === status);
    }

    // Class filter
    if (classFilter && classFilter !== 'all') {
      filtered = filtered.filter(s => s.currentClass === classFilter);
    }

    // Search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        s =>
          `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchLower) ||
          s.studentIdNumber.toLowerCase().includes(searchLower) ||
          s.admissionNumber.toLowerCase().includes(searchLower)
      );
    }

    setFilteredStudents(filtered);
  };

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    applyFilters(students, value, selectedStatus, selectedClass);
  };

  // Handle status filter
  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
    applyFilters(students, searchTerm, value, selectedClass);
  };

  // Handle class filter
  const handleClassChange = (value: string) => {
    setSelectedClass(value);
    applyFilters(students, searchTerm, selectedStatus, value);
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedStudentId) return;

    try {
      setIsDeleting(true);
      await deleteStudent(selectedStudentId);
      
      // Remove from UI
      const updated = students.filter(s => s.id !== selectedStudentId);
      setStudents(updated);
      applyFilters(updated, searchTerm, selectedStatus, selectedClass);
      
      toast({
        title: 'Success',
        description: 'Student deleted successfully',
      });
      
      setDeleteDialogOpen(false);
      setSelectedStudentId(null);
    } catch (error) {
      console.error('Error deleting student:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete student',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Get unique classes
  const classes = Array.from(new Set(students.map(s => s.currentClass).filter(Boolean))).sort();

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <PageHeader
          title="Students"
          description="Manage and view all students in your school"
        />
        <Link href={currentOrgId ? `/students/register?org=${currentOrgId}` : '/students/register'}>
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Register New Student
          </Button>
        </Link>
      </div>

      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search by name, ID, or admission number..."
                value={searchTerm}
                onChange={e => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={selectedStatus} onValueChange={handleStatusChange}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="graduated">Graduated</SelectItem>
                <SelectItem value="transferred">Transferred</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>

            {/* Class Filter */}
            <Select value={selectedClass} onValueChange={handleClassChange}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map(cls => (
                  <SelectItem key={cls} value={cls}>
                    {cls}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-gray-600">
            Showing <span className="font-semibold">{filteredStudents.length}</span> of{' '}
            <span className="font-semibold">{students.length}</span> students
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600">No students found matching your criteria</p>
              <Link href="/students/register">
                <Button className="mt-4" variant="outline">
                  Register First Student
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>ID Number</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Enrollment Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map(student => (
                    <TableRow key={student.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        {student.firstName} {student.lastName}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {student.studentIdNumber}
                      </TableCell>
                      <TableCell>{student.currentClass}</TableCell>
                      <TableCell className="text-sm">{student.email || '-'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            student.status === 'active'
                              ? 'default'
                              : student.status === 'inactive'
                              ? 'secondary'
                              : student.status === 'graduated'
                              ? 'outline'
                              : 'destructive'
                          }
                        >
                          {student.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(student.enrollmentDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/students/${student.id}`}>
                            <Button size="sm" variant="ghost" title="View">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/students/${student.id}/edit`}>
                            <Button size="sm" variant="ghost" title="Edit">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700"
                            title="Delete"
                            onClick={() => {
                              setSelectedStudentId(student.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Student</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this student? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-4">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Statistics Card */}
      <Card>
        <CardHeader>
          <CardTitle>Student Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Students</p>
              <p className="text-2xl font-bold">{students.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600">
                {students.filter(s => s.status === 'active').length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Inactive</p>
              <p className="text-2xl font-bold text-yellow-600">
                {students.filter(s => s.status === 'inactive').length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Graduated</p>
              <p className="text-2xl font-bold text-blue-600">
                {students.filter(s => s.status === 'graduated').length}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Classes</p>
              <p className="text-2xl font-bold text-purple-600">
                {classes.length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
