'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Award, 
  Plus, 
  Edit2, 
  Trash2,
  TrendingUp,
  TrendingDown,
  FileText,
  BookOpen,
  GraduationCap
} from 'lucide-react';
import { getSchoolClasses } from '@/services/class';
import { getStudentsByOrganization } from '@/services/student';
import { 
  getGradesBySchool,
  getStudentGrades,
  createGrade,
  updateGrade,
  deleteGrade,
  type Grade 
} from '@/services/grade';
import { format } from 'date-fns';

type AssessmentType = 'exam' | 'quiz' | 'assignment' | 'project' | 'homework' | 'other';

const SUBJECTS = [
  'Mathematics',
  'English',
  'Science',
  'Social Studies',
  'Computer Science',
  'Physics',
  'Chemistry',
  'Biology',
  'History',
  'Geography',
  'Literature',
  'Languages',
  'Art',
  'Music',
  'Physical Education'
];

const ASSESSMENT_TYPES: { value: AssessmentType; label: string }[] = [
  { value: 'exam', label: 'Exam' },
  { value: 'quiz', label: 'Quiz' },
  { value: 'assignment', label: 'Assignment' },
  { value: 'project', label: 'Project' },
  { value: 'homework', label: 'Homework' },
  { value: 'other', label: 'Other' }
];

interface GradeFormData {
  studentId: string;
  subject: string;
  assessmentType: AssessmentType;
  assessmentName: string;
  grade: number;
  maxGrade: number;
  term: string;
  date: string;
  comments?: string;
}

export default function GradesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedTerm, setSelectedTerm] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const [formData, setFormData] = useState<GradeFormData>({
    studentId: '',
    subject: '',
    assessmentType: 'exam',
    assessmentName: '',
    grade: 0,
    maxGrade: 100,
    term: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    comments: ''
  });

  // Load data on mount
  useEffect(() => {
    if (user?.currentOrganizationId) {
      loadClasses();
      loadGrades();
    }
  }, [user?.currentOrganizationId]);

  // Load students when class is selected
  useEffect(() => {
    if (selectedClass && user?.currentOrganizationId) {
      loadStudents();
    }
  }, [selectedClass, user?.currentOrganizationId]);

  // Filter grades when filters change
  useEffect(() => {
    if (user?.currentOrganizationId) {
      loadGrades();
    }
  }, [selectedClass, selectedSubject, selectedTerm, user?.currentOrganizationId]);

  const loadClasses = async () => {
    try {
      const classData = await getSchoolClasses(user!.currentOrganizationId!);
      setClasses(classData);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load classes',
        variant: 'destructive'
      });
    }
  };

  const loadStudents = async () => {
    try {
      const studentData = await getStudentsByOrganization(
        user!.currentOrganizationId!, 
        { classFilter: selectedClass && selectedClass !== 'all' ? selectedClass : undefined }
      );
      setStudents(studentData);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load students',
        variant: 'destructive'
      });
    }
  };

  const loadGrades = async () => {
    try {
      setLoading(true);
      const gradeData = await getGradesBySchool(
        user!.currentOrganizationId!,
        selectedClass && selectedClass !== 'all' ? selectedClass : undefined,
        selectedSubject && selectedSubject !== 'all' ? selectedSubject : undefined,
        selectedTerm && selectedTerm !== 'all' ? selectedTerm : undefined
      );
      setGrades(gradeData);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load grades',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (grade?: Grade) => {
    if (grade) {
      setEditingGrade(grade);
      setFormData({
        studentId: grade.studentId,
        subject: grade.subject,
        assessmentType: grade.assessmentType || 'exam',
        assessmentName: grade.assessmentName || '',
        grade: grade.grade,
        maxGrade: grade.maxGrade || 100,
        term: grade.term || '',
        date: grade.date || format(new Date(), 'yyyy-MM-dd'),
        comments: grade.comments || ''
      });
    } else {
      setEditingGrade(null);
      setFormData({
        studentId: '',
        subject: '',
        assessmentType: 'exam',
        assessmentName: '',
        grade: 0,
        maxGrade: 100,
        term: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        comments: ''
      });
    }
    setDialogOpen(true);
  };

  const handleSaveGrade = async () => {
    try {
      // Validation
      if (!formData.studentId || !formData.subject || !formData.assessmentName) {
        toast({
          title: 'Validation Error',
          description: 'Please fill in all required fields',
          variant: 'destructive'
        });
        return;
      }

      setSaving(true);
      
      const student = students.find(s => s.id === formData.studentId);
      const gradeData = {
        studentId: formData.studentId,
        studentName: student ? `${student.firstName} ${student.lastName}` : '',
        organizationId: user!.currentOrganizationId!,
        class: selectedClass,
        subject: formData.subject,
        assessmentType: formData.assessmentType,
        assessmentName: formData.assessmentName,
        grade: formData.grade,
        maxGrade: formData.maxGrade,
        term: formData.term,
        date: formData.date,
        comments: formData.comments || null
      };

      if (editingGrade) {
        await updateGrade(editingGrade.id, gradeData);
        toast({
          title: 'Success',
          description: 'Grade updated successfully'
        });
      } else {
        await createGrade(gradeData);
        toast({
          title: 'Success',
          description: 'Grade added successfully'
        });
      }
      
      setDialogOpen(false);
      await loadGrades();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save grade',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGrade = async (id: string) => {
    if (!confirm('Are you sure you want to delete this grade?')) return;
    
    try {
      await deleteGrade(id);
      toast({
        title: 'Success',
        description: 'Grade deleted successfully'
      });
      await loadGrades();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete grade',
        variant: 'destructive'
      });
    }
  };

  const getLetterGradeBadge = (grade: string | undefined) => {
    if (!grade) return null;
    
    const colors: Record<string, string> = {
      A: 'bg-green-500',
      B: 'bg-blue-500',
      C: 'bg-yellow-500',
      D: 'bg-orange-500',
      F: 'bg-red-500'
    };
    
    return (
      <Badge className={`${colors[grade] || 'bg-gray-500'} text-white`}>
        {grade}
      </Badge>
    );
  };

  const calculatePercentage = (grade: number, maxGrade?: number) => {
    if (!maxGrade) return null;
    return ((grade / maxGrade) * 100).toFixed(1);
  };

  const calculateStats = () => {
    if (grades.length === 0) return { average: 0, highest: 0, lowest: 0, total: 0 };
    
    const scores = grades.map(g => {
      if (g.maxGrade) {
        return (g.grade / g.maxGrade) * 100;
      }
      return g.grade;
    });
    
    return {
      average: scores.reduce((a, b) => a + b, 0) / scores.length,
      highest: Math.max(...scores),
      lowest: Math.min(...scores),
      total: grades.length
    };
  };

  const stats = calculateStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Grades & Assessments</h1>
          <p className="text-muted-foreground mt-2">
            Manage student grades and academic performance
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Grade
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Grades</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.average.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Highest Score</CardTitle>
            <Award className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.highest.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lowest Score</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.lowest.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Grades Table */}
      <Card>
        <CardHeader>
          <CardTitle>Grade Records</CardTitle>
          <CardDescription>View and manage student grade records</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="class-filter">Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger id="class-filter">
                  <SelectValue placeholder="All classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All classes</SelectItem>
                  {classes.map(cls => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="subject-filter">Subject</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger id="subject-filter">
                  <SelectValue placeholder="All subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All subjects</SelectItem>
                  {SUBJECTS.map(subject => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="term-filter">Term</Label>
              <Input
                id="term-filter"
                placeholder="e.g., Term 1, Semester 1"
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Grades Table */}
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : grades.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <GraduationCap className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No grades found</p>
              <p className="text-sm">Add grades to start tracking student performance</p>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Assessment</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grades.map(grade => (
                    <TableRow key={grade.id}>
                      <TableCell className="font-medium">
                        {grade.studentName || '-'}
                      </TableCell>
                      <TableCell>{grade.subject}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{grade.assessmentName}</div>
                          <div className="text-xs text-muted-foreground">
                            {ASSESSMENT_TYPES.find(t => t.value === grade.assessmentType)?.label || 'Other'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {grade.grade}/{grade.maxGrade || 100}
                          </div>
                          {grade.maxGrade && (
                            <div className="text-xs text-muted-foreground">
                              {calculatePercentage(grade.grade, grade.maxGrade)}%
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getLetterGradeBadge(grade.letterGrade)}</TableCell>
                      <TableCell>
                        {grade.date ? format(new Date(grade.date), 'MMM dd, yyyy') : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(grade)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteGrade(grade.id)}
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

      {/* Add/Edit Grade Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingGrade ? 'Edit Grade' : 'Add New Grade'}
            </DialogTitle>
            <DialogDescription>
              Enter the grade details below
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="student">Student *</Label>
                <Select
                  value={formData.studentId}
                  onValueChange={(value) => setFormData({ ...formData, studentId: value })}
                >
                  <SelectTrigger id="student">
                    <SelectValue placeholder="Select a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map(student => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.firstName} {student.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Select
                  value={formData.subject}
                  onValueChange={(value) => setFormData({ ...formData, subject: value })}
                >
                  <SelectTrigger id="subject">
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map(subject => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="assessment-type">Assessment Type</Label>
                <Select
                  value={formData.assessmentType}
                  onValueChange={(value) => setFormData({ ...formData, assessmentType: value as AssessmentType })}
                >
                  <SelectTrigger id="assessment-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSESSMENT_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="assessment-name">Assessment Name *</Label>
                <Input
                  id="assessment-name"
                  placeholder="e.g., Mid-term Exam, Quiz 1"
                  value={formData.assessmentName}
                  onChange={(e) => setFormData({ ...formData, assessmentName: e.target.value })}
                />
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="grade-score">Score *</Label>
                <Input
                  id="grade-score"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: parseFloat(e.target.value) || 0 })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="max-grade">Max Score *</Label>
                <Input
                  id="max-grade"
                  type="number"
                  min="1"
                  value={formData.maxGrade}
                  onChange={(e) => setFormData({ ...formData, maxGrade: parseFloat(e.target.value) || 100 })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Percentage</Label>
                <div className="h-10 flex items-center text-lg font-semibold">
                  {((formData.grade / formData.maxGrade) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="term">Term/Semester</Label>
                <Input
                  id="term"
                  placeholder="e.g., Term 1, Semester 1"
                  value={formData.term}
                  onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="comments">Comments</Label>
              <Textarea
                id="comments"
                placeholder="Add any comments or feedback..."
                rows={3}
                value={formData.comments}
                onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveGrade} disabled={saving}>
              {saving ? 'Saving...' : editingGrade ? 'Update Grade' : 'Add Grade'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}