'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
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
import {
  createClass,
  getSchoolClasses,
  updateClass,
  deleteClass,
  getSchoolSubjects,
  createSubject,
} from '@/services/class';
import {
  SchoolClass,
  Subject,
  SchoolClassInput,
  SubjectInput,
  SchoolClassSchema,
  SubjectSchema,
} from '@/schemas/class';
import { PageHeader } from '@/components/common/page-header';
import {
  Plus,
  Edit,
  Trash2,
  Users,
  BookOpen,
  MoreVertical,
  Loader2,
  GraduationCap,
  UserCheck,
} from 'lucide-react';

const GRADE_LEVELS = [
  'Pre-School',
  'Kindergarten',
  'Grade 1',
  'Grade 2',
  'Grade 3',
  'Grade 4',
  'Grade 5',
  'Grade 6',
  'JSS 1',
  'JSS 2',
  'JSS 3',
  'SSS 1',
  'SSS 2',
  'SSS 3',
];

const SECTIONS = ['A', 'B', 'C', 'D', 'E', 'F'];

const classSchema = zodResolver(SchoolClassSchema);
const subjectSchema = zodResolver(SubjectSchema);

export default function ClassesPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<SchoolClass | null>(null);
  const [academicYear, setAcademicYear] = useState('2024/2025');

  const createForm = useForm<SchoolClassInput>({
    resolver: classSchema,
    defaultValues: {
      schoolId: currentUser?.schoolId || '',
      className: '',
      gradeLevel: '',
      section: '',
      academicYear: '2024/2025',
      capacity: 30,
      currentEnrollment: 0,
      subjects: [],
      isActive: true,
      description: '',
    },
  });

  const editForm = useForm<SchoolClassInput>({
    resolver: classSchema,
    defaultValues: {
      schoolId: currentUser?.schoolId || '',
      className: '',
      gradeLevel: '',
      section: '',
      academicYear: '2024/2025',
      capacity: 30,
      currentEnrollment: 0,
      subjects: [],
      isActive: true,
      description: '',
    },
  });

  useEffect(() => {
    if (currentUser?.schoolId) {
      loadData();
    }
  }, [currentUser?.schoolId, academicYear]);

  const loadData = async () => {
    if (!currentUser?.schoolId) return;

    setLoading(true);
    try {
      const [classesData, subjectsData] = await Promise.all([
        getSchoolClasses(currentUser.schoolId, academicYear),
        getSchoolSubjects(currentUser.schoolId),
      ]);

      setClasses(classesData);
      setSubjects(subjectsData);
    } catch (error) {
      console.error('Error loading classes data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load classes data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const onCreateClass = async (data: SchoolClassInput) => {
    try {
      await createClass({
        ...data,
        schoolId: currentUser?.schoolId || '',
        academicYear,
      });

      toast({
        title: 'Success',
        description: 'Class created successfully',
      });

      createForm.reset();
      setCreateDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('Error creating class:', error);
      toast({
        title: 'Error',
        description: 'Failed to create class',
        variant: 'destructive',
      });
    }
  };

  const onEditClass = async (data: SchoolClassInput) => {
    if (!selectedClass) return;

    try {
      await updateClass(selectedClass.id, data);

      toast({
        title: 'Success',
        description: 'Class updated successfully',
      });

      editForm.reset();
      setEditDialogOpen(false);
      setSelectedClass(null);
      loadData();
    } catch (error) {
      console.error('Error updating class:', error);
      toast({
        title: 'Error',
        description: 'Failed to update class',
        variant: 'destructive',
      });
    }
  };

  const onDeleteClass = async () => {
    if (!selectedClass) return;

    try {
      await deleteClass(selectedClass.id);

      toast({
        title: 'Success',
        description: 'Class deleted successfully',
      });

      setDeleteDialogOpen(false);
      setSelectedClass(null);
      loadData();
    } catch (error) {
      console.error('Error deleting class:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete class',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (classItem: SchoolClass) => {
    setSelectedClass(classItem);
    editForm.reset({
      ...classItem,
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (classItem: SchoolClass) => {
    setSelectedClass(classItem);
    setDeleteDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Class Management"
        description="Create and manage school classes, assign teachers, and organize subjects"
        actions={
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Class
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Class</DialogTitle>
                <DialogDescription>
                  Add a new class to your school for the {academicYear} academic year.
                </DialogDescription>
              </DialogHeader>

              <Form {...createForm}>
                <form onSubmit={createForm.handleSubmit(onCreateClass)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={createForm.control}
                      name="gradeLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Grade Level</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select grade" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {GRADE_LEVELS.map((grade) => (
                                <SelectItem key={grade} value={grade}>
                                  {grade}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={createForm.control}
                      name="section"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Section</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select section" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {SECTIONS.map((section) => (
                                <SelectItem key={section} value={section}>
                                  {section}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={createForm.control}
                    name="capacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Class Capacity</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="30"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Additional notes about this class..."
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Create Class</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classes.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active classes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Enrollment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {classes.reduce((sum, cls) => sum + cls.currentEnrollment, 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Students enrolled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Available Capacity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {classes.reduce((sum, cls) => sum + (cls.capacity - cls.currentEnrollment), 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Open spots
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Subjects Offered
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subjects.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active subjects
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Classes Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Classes Overview</CardTitle>
              <CardDescription>
                All classes for {academicYear}
              </CardDescription>
            </div>
            <Select value={academicYear} onValueChange={setAcademicYear}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024/2025">2024/2025</SelectItem>
                <SelectItem value="2025/2026">2025/2026</SelectItem>
                <SelectItem value="2026/2027">2026/2027</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Class Name</TableHead>
                  <TableHead>Grade Level</TableHead>
                  <TableHead>Enrollment</TableHead>
                  <TableHead>Class Teacher</TableHead>
                  <TableHead>Subjects</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No classes found. Create your first class to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  classes.map((classItem) => (
                    <TableRow key={classItem.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{classItem.className}</TableCell>
                      <TableCell>{classItem.gradeLevel}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {classItem.currentEnrollment}/{classItem.capacity}
                        </div>
                      </TableCell>
                      <TableCell>
                        {classItem.classTeacherName ? (
                          <div className="flex items-center gap-2">
                            <UserCheck className="h-4 w-4 text-green-600" />
                            {classItem.classTeacherName}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Not assigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          {classItem.subjects.length} subjects
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={classItem.isActive ? 'default' : 'secondary'}>
                          {classItem.isActive ? 'Active' : 'Inactive'}
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
                            <DropdownMenuItem onClick={() => openEditDialog(classItem)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Class
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <GraduationCap className="h-4 w-4 mr-2" />
                              Assign Teacher
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <BookOpen className="h-4 w-4 mr-2" />
                              Manage Subjects
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openDeleteDialog(classItem)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Class
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

      {/* Edit Class Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Class</DialogTitle>
            <DialogDescription>
              Update class information and settings.
            </DialogDescription>
          </DialogHeader>

          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditClass)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="gradeLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grade Level</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select grade" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {GRADE_LEVELS.map((grade) => (
                            <SelectItem key={grade} value={grade}>
                              {grade}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="section"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Section</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select section" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SECTIONS.map((section) => (
                            <SelectItem key={section} value={section}>
                              {section}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class Capacity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="30"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional notes about this class..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Update Class</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Class?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete {selectedClass?.className}? This action cannot be undone and will affect all students and assignments in this class.
          </AlertDialogDescription>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDeleteClass}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Class
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}