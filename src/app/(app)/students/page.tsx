
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
    <div className="space-y-8 animate-fade-in">
      {/* Modern Header */}
      <div className="card-modern rounded-3xl p-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Students</h1>
            <p className="text-gray-600 text-lg">Manage and view all students in your school</p>
          </div>
          <Link href={currentOrgId ? `/students/register?org=${currentOrgId}` : '/students/register'}>
            <Button className="btn-modern rounded-2xl px-6 py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
              <UserPlus className="mr-2 h-5 w-5" />
              Register New Student
            </Button>
          </Link>
        </div>
      </div>

      {/* Modern Filters Card */}
      <div className="card-modern rounded-3xl p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Filter className="h-6 w-6 text-green-600" />
            Filters & Search
          </h2>
          <p className="text-gray-600">Find and filter students by various criteria</p>
        </div>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
              <Input
                placeholder="Search by name, ID, or admission number..."
                value={searchTerm}
                onChange={e => handleSearch(e.target.value)}
                className="input-modern rounded-2xl pl-12 h-12 text-base"
              />
            </div>

            {/* Status Filter */}
            <Select value={selectedStatus} onValueChange={handleStatusChange}>
              <SelectTrigger className="input-modern rounded-2xl h-12 text-base">
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
              <SelectTrigger className="input-modern rounded-2xl h-12 text-base">
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

          <div className="text-sm text-gray-600 bg-gray-50 rounded-2xl px-4 py-3">
            <span className="font-semibold text-lg text-gray-900">{filteredStudents.length}</span> of{' '}
            <span className="font-semibold text-lg text-gray-900">{students.length}</span> students
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="card-modern rounded-3xl p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Student Directory</h2>
          <p className="text-gray-600">Complete list of all students with their details</p>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-green-600" />
              <p className="text-gray-600">Loading students...</p>
            </div>
          </div>
          ) : filteredStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-6">
                <AlertCircle className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No students found</h3>
              <p className="text-gray-600 mb-6">No students match your current filters</p>
              <Link href="/students/register">
                <Button className="btn-modern rounded-2xl px-6 py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                  Register First Student
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200 hover:bg-gray-50">
                    <TableHead className="text-gray-900 font-bold text-base">Student Name</TableHead>
                    <TableHead className="text-gray-900 font-bold text-base">ID Number</TableHead>
                    <TableHead className="text-gray-900 font-bold text-base">Class</TableHead>
                    <TableHead className="text-gray-900 font-bold text-base">Email</TableHead>
                    <TableHead className="text-gray-900 font-bold text-base">Status</TableHead>
                    <TableHead className="text-gray-900 font-bold text-base">Enrollment Date</TableHead>
                    <TableHead className="text-right text-gray-900 font-bold text-base">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map(student => (
                    <TableRow key={student.id} className="hover:bg-gray-50 border-gray-200">
                      <TableCell className="font-semibold text-gray-900">
                        {student.firstName} {student.lastName}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-gray-700">
                        {student.studentIdNumber}
                      </TableCell>
                      <TableCell className="text-gray-700">{student.currentClass}</TableCell>
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
                            <Button size="sm" variant="ghost" className="rounded-xl hover:bg-green-50 hover:text-green-600 transition-colors" title="View">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/students/${student.id}/edit`}>
                            <Button size="sm" variant="ghost" className="rounded-xl hover:bg-emerald-50 hover:text-emerald-600 transition-colors" title="Edit">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
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
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold">Delete Student</AlertDialogTitle>
            <AlertDialogDescription className="text-base text-gray-600">
              Are you sure you want to delete this student? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-4">
            <AlertDialogCancel className="rounded-2xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-2xl bg-red-600 hover:bg-red-700"
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
      <div className="card-modern rounded-3xl p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Student Statistics</h2>
          <p className="text-gray-600">Overview of student distribution and status</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200">
            <p className="text-sm text-green-700 font-semibold mb-2">Total Students</p>
            <p className="text-4xl font-bold text-green-900">{students.length}</p>
          </div>
          <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-100 border border-emerald-200">
            <p className="text-sm text-emerald-700 font-semibold mb-2">Active</p>
            <p className="text-4xl font-bold text-emerald-900">
              {students.filter(s => s.status === 'active').length}
            </p>
          </div>
          <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200">
            <p className="text-sm text-yellow-700 font-semibold mb-2">Inactive</p>
            <p className="text-4xl font-bold text-yellow-900">
              {students.filter(s => s.status === 'inactive').length}
            </p>
          </div>
          <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200">
            <p className="text-sm text-indigo-700 font-semibold mb-2">Graduated</p>
            <p className="text-4xl font-bold text-indigo-900">
              {students.filter(s => s.status === 'graduated').length}
            </p>
          </div>
          <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-teal-50 to-cyan-100 border border-teal-200">
            <p className="text-sm text-teal-700 font-semibold mb-2">Classes</p>
            <p className="text-4xl font-bold text-teal-900">
              {classes.length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
