'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Edit,
  Trash2,
  BookOpen,
  GraduationCap,
  Dumbbell,
  Search,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';
import {
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  toggleSubjectStatus,
  checkSubjectCodeExists,
  type Subject,
} from '@/services/subject';
import { Textarea } from '@/components/ui/textarea';

export default function SubjectsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'core' | 'elective' | 'activity'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: 'core' as 'core' | 'elective' | 'activity',
    periodsPerWeek: 5,
    description: '',
  });

  useEffect(() => {
    if (user?.currentOrganizationId) {
      loadSubjects();
    }
  }, [user?.currentOrganizationId]);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const data = await getSubjects(user!.currentOrganizationId!);
      setSubjects(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load subjects',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (subject?: Subject) => {
    if (subject) {
      setEditingSubject(subject);
      setFormData({
        name: subject.name,
        code: subject.code,
        category: subject.category,
        periodsPerWeek: subject.periodsPerWeek,
        description: subject.description || '',
      });
    } else {
      setEditingSubject(null);
      setFormData({
        name: '',
        code: '',
        category: 'core',
        periodsPerWeek: 5,
        description: '',
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Subject name is required',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.code.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Subject code is required',
        variant: 'destructive',
      });
      return;
    }

    // Check if code already exists
    const codeExists = await checkSubjectCodeExists(
      user!.currentOrganizationId!,
      formData.code,
      editingSubject?.id
    );

    if (codeExists) {
      toast({
        title: 'Validation Error',
        description: 'Subject code already exists',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);

      if (editingSubject) {
        await updateSubject(editingSubject.id, {
          ...formData,
          code: formData.code.toUpperCase(),
        });
        toast({
          title: 'Success',
          description: 'Subject updated successfully',
        });
      } else {
        await createSubject({
          organizationId: user!.currentOrganizationId!,
          ...formData,
          code: formData.code.toUpperCase(),
          isActive: true,
        });
        toast({
          title: 'Success',
          description: 'Subject created successfully',
        });
      }

      setDialogOpen(false);
      loadSubjects();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save subject',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!subjectToDelete) return;

    try {
      setSaving(true);
      await deleteSubject(subjectToDelete.id);
      toast({
        title: 'Success',
        description: 'Subject deleted successfully',
      });
      setDeleteDialogOpen(false);
      setSubjectToDelete(null);
      loadSubjects();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete subject',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (subject: Subject) => {
    try {
      await toggleSubjectStatus(subject.id, !subject.isActive);
      toast({
        title: 'Success',
        description: `Subject ${subject.isActive ? 'deactivated' : 'activated'} successfully`,
      });
      loadSubjects();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to toggle subject status',
        variant: 'destructive',
      });
    }
  };

  const filteredSubjects = subjects.filter((subject) => {
    const matchesSearch =
      subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subject.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || subject.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'core':
        return <BookOpen className="h-4 w-4" />;
      case 'elective':
        return <GraduationCap className="h-4 w-4" />;
      case 'activity':
        return <Dumbbell className="h-4 w-4" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'core':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'elective':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'activity':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSubjectStats = () => {
    return {
      total: subjects.length,
      active: subjects.filter((s) => s.isActive).length,
      core: subjects.filter((s) => s.category === 'core').length,
      elective: subjects.filter((s) => s.category === 'elective').length,
      activity: subjects.filter((s) => s.category === 'activity').length,
    };
  };

  const stats = getSubjectStats();

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Subject Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage your school's curriculum subjects
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Subject
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Subjects</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.active}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Core Subjects</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{stats.core}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Electives</CardDescription>
            <CardTitle className="text-3xl text-purple-600">{stats.elective}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Activities</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.activity}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Subjects</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search subjects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={categoryFilter} onValueChange={(v: any) => setCategoryFilter(v)}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="core">Core</SelectItem>
                <SelectItem value="elective">Elective</SelectItem>
                <SelectItem value="activity">Activity</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Subjects Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>School Types</TableHead>
                  <TableHead>Periods/Week</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubjects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No subjects found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubjects.map((subject) => (
                    <TableRow key={subject.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{subject.name}</p>
                          {subject.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {subject.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {subject.code}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getCategoryColor(subject.category)}
                        >
                          <span className="flex items-center gap-1">
                            {getCategoryIcon(subject.category)}
                            {subject.category.charAt(0).toUpperCase() + subject.category.slice(1)}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {subject.schoolTypes && subject.schoolTypes.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {subject.schoolTypes.map((type) => (
                              <Badge 
                                key={type} 
                                variant="secondary" 
                                className="text-xs"
                              >
                                {type === 'preschool' ? 'Pre-School' : 
                                 type === 'primary' ? 'Primary' : 
                                 type === 'jhs' ? 'JHS' : 'SHS'}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">All</span>
                        )}
                      </TableCell>
                      <TableCell>{subject.periodsPerWeek}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(subject)}
                          className="h-8"
                        >
                          {subject.isActive ? (
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-100">
                              <XCircle className="h-3 w-3 mr-1" />
                              Inactive
                            </Badge>
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(subject)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSubjectToDelete(subject);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSubject ? 'Edit Subject' : 'Add New Subject'}
            </DialogTitle>
            <DialogDescription>
              {editingSubject
                ? 'Update the subject information'
                : 'Add a new subject to your curriculum'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Subject Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Mathematics"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Subject Code *</Label>
              <Input
                id="code"
                placeholder="e.g., MATH"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value.toUpperCase() })
                }
                maxLength={10}
              />
              <p className="text-xs text-muted-foreground">
                Short code for the subject (e.g., MATH, ENG, SCI)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(v: any) => setFormData({ ...formData, category: v })}
              >
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="core">Core Subject</SelectItem>
                  <SelectItem value="elective">Elective</SelectItem>
                  <SelectItem value="activity">Activity/Co-Curricular</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="periods">Periods Per Week *</Label>
              <Input
                id="periods"
                type="number"
                min="1"
                max="20"
                value={formData.periodsPerWeek}
                onChange={(e) =>
                  setFormData({ ...formData, periodsPerWeek: parseInt(e.target.value) })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the subject..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : editingSubject ? (
                'Update Subject'
              ) : (
                'Add Subject'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Subject</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{subjectToDelete?.name}"? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
