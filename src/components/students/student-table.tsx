'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoreHorizontal, Search, Pencil, Trash2, Eye, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Student } from "@/services/student";
import { getStudentsByOrganization, deleteStudent } from "@/services/student";
import { Skeleton } from "@/components/ui/skeleton";

interface StudentTableProps {
  organizationId: string;
  onEditStudent?: (student: Student) => void;
  onViewStudent?: (student: Student) => void;
}

export function StudentTable({ organizationId, onEditStudent, onViewStudent }: StudentTableProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  // Fetch students on mount
  useEffect(() => {
    fetchStudents();
  }, [organizationId]);

  // Filter students based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredStudents(students);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = students.filter(student => {
      const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
      const email = student.email?.toLowerCase() || '';
      const currentClass = student.currentClass?.toLowerCase() || '';
      const studentId = student.studentIdNumber?.toLowerCase() || '';
      
      return fullName.includes(query) ||
        email.includes(query) ||
        currentClass.includes(query) ||
        studentId.includes(query);
    });
    setFilteredStudents(filtered);
  }, [searchQuery, students]);

  async function fetchStudents() {
    try {
      setLoading(true);
      const fetchedStudents = await getStudentsByOrganization(organizationId);
      setStudents(fetchedStudents);
      setFilteredStudents(fetchedStudents);
    } catch (error: any) {
      console.error('Error fetching students:', error);
      toast({
        title: "Error",
        description: "Failed to load students. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  function handleDeleteClick(student: Student) {
    setStudentToDelete(student);
    setDeleteDialogOpen(true);
  }

  async function handleDeleteConfirm() {
    if (!studentToDelete) return;

    try {
      setDeleting(true);
      await deleteStudent(studentToDelete.id);
      
      toast({
        title: "Student Deleted",
        description: `${studentToDelete.firstName} ${studentToDelete.lastName} has been removed from the system.`,
      });

      // Refresh the list
      await fetchStudents();
      setDeleteDialogOpen(false);
      setStudentToDelete(null);
    } catch (error: any) {
      console.error('Error deleting student:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete student.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  }

  function getStatusBadge(status?: string) {
    const statusValue = status || 'active';
    
    // Define badge variants and colors for each status
    const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', className?: string }> = {
      active: { variant: 'default' },
      inactive: { variant: 'secondary' },
      graduated: { variant: 'outline' },
      transferred: { variant: 'destructive' },
      draft: { variant: 'outline', className: 'border-amber-500 text-amber-700 bg-amber-50' },
    };

    const config = statusConfig[statusValue] || { variant: 'default' };

    return (
      <Badge variant={config.variant} className={config.className}>
        {statusValue.charAt(0).toUpperCase() + statusValue.slice(1)}
      </Badge>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, class, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={fetchStudents} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Students Count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredStudents.length} of {students.length} students
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Parent Contact</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {searchQuery ? 'No students found matching your search.' : 'No students registered yet.'}
                </TableCell>
              </TableRow>
            ) : (
              filteredStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-mono text-sm">
                    {student.studentIdNumber || '-'}
                  </TableCell>
                  <TableCell className="font-medium">{student.firstName} {student.lastName}</TableCell>
                  <TableCell className="text-sm">{student.email || '-'}</TableCell>
                  <TableCell>{student.currentClass}</TableCell>
                  <TableCell>{getStatusBadge(student.status)}</TableCell>
                  <TableCell className="text-sm">
                    {student.guardians?.[0]?.email || student.guardians?.[0]?.phone || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {onViewStudent && (
                          <DropdownMenuItem onClick={() => onViewStudent(student)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                        )}
                        {onEditStudent && (
                          <DropdownMenuItem onClick={() => onEditStudent(student)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeleteClick(student)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the student record for{' '}
              <strong>{studentToDelete?.firstName} {studentToDelete?.lastName}</strong>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
