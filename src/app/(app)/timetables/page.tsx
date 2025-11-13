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
  Calendar,
  Clock,
  User,
  BookOpen,
  Loader2,
  CalendarPlus,
  Wand2,
  Download,
  Upload,
  AlertCircle,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';
import {
  generateTimetable,
  getTimetableEntries,
  createTimetableEntry,
  updateTimetableEntry,
  deleteTimetableEntry,
  checkConflicts,
  validateTimetable,
  exportTimetable,
  type TimetableEntry,
  type TimetableGenerationParams,
  type TimetableConflict,
  type TimetableValidationResult,
} from '@/services/timetable';
import { getSchoolClasses } from '@/services/class';
import { getTeachers } from '@/services/staff';
import { format } from 'date-fns';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
const DEFAULT_PERIODS = 8;
const DEFAULT_PERIOD_DURATION = 45; // minutes

interface ClassInfo {
  id: string;
  name: string;
}

interface TeacherInfo {
  id: string;
  firstName: string;
  lastName: string;
  subjects?: string[];
}

interface Subject {
  id: string;
  name: string;
  periodsPerWeek: number;
}

const DEFAULT_SUBJECTS: Subject[] = [
  { id: 'math', name: 'Mathematics', periodsPerWeek: 5 },
  { id: 'english', name: 'English', periodsPerWeek: 5 },
  { id: 'science', name: 'Science', periodsPerWeek: 4 },
  { id: 'social', name: 'Social Studies', periodsPerWeek: 3 },
  { id: 'pe', name: 'Physical Education', periodsPerWeek: 2 },
  { id: 'art', name: 'Art', periodsPerWeek: 2 },
  { id: 'music', name: 'Music', periodsPerWeek: 2 },
  { id: 'computer', name: 'Computer Science', periodsPerWeek: 3 },
];

export default function TimetablePage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [teachers, setTeachers] = useState<TeacherInfo[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>(DEFAULT_SUBJECTS);
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedView, setSelectedView] = useState<'class' | 'teacher'>('class');
  const [selectedEntity, setSelectedEntity] = useState<string>('');
  
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [validating, setValidating] = useState(false);
  
  // Dialog states
  const [entryDialogOpen, setEntryDialogOpen] = useState(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);
  
  // Validation & conflicts
  const [conflicts, setConflicts] = useState<TimetableConflict[]>([]);
  const [validationResult, setValidationResult] = useState<TimetableValidationResult | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    classId: '',
    subjectId: '',
    teacherId: '',
    dayOfWeek: 'Monday' as typeof DAYS_OF_WEEK[number],
    period: 1,
    startTime: '08:00',
    endTime: '08:45',
    room: '',
  });

  // Generation params
  const [genParams, setGenParams] = useState<Partial<TimetableGenerationParams>>({
    periodsPerDay: DEFAULT_PERIODS,
    periodDuration: DEFAULT_PERIOD_DURATION,
    startTime: '08:00',
    breakAfterPeriod: 4,
    breakDuration: 15,
    lunchAfterPeriod: 6,
    lunchDuration: 45,
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  });

  useEffect(() => {
    if (user?.currentOrganizationId) {
      loadData();
    }
  }, [user?.currentOrganizationId]);

  useEffect(() => {
    if (selectedEntity && user?.currentOrganizationId) {
      loadTimetable();
    }
  }, [selectedEntity, selectedView, user?.currentOrganizationId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [classesData, teachersData] = await Promise.all([
        getSchoolClasses(user!.currentOrganizationId!),
        getTeachers(user!.currentOrganizationId!),
      ]);

      setClasses(classesData.map((c: any) => ({ id: c.id, name: c.className || 'Unknown' })));
      setTeachers(teachersData.map((t: any) => ({
        id: t.id,
        firstName: t.name?.split(' ')[0] || 'Unknown',
        lastName: t.name?.split(' ').slice(1).join(' ') || '',
        subjects: t.subjects || [],
      })));
      
      if (classesData.length > 0 && !selectedEntity) {
        setSelectedEntity(classesData[0].id);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTimetable = async () => {
    try {
      setLoading(true);
      const filters = selectedView === 'class' 
        ? { classId: selectedEntity }
        : { teacherId: selectedEntity };
      
      const entries = await getTimetableEntries(user!.currentOrganizationId!, filters);
      setTimetableEntries(entries);
      
      // Check for conflicts
      const conflictsFound = await checkConflicts(user!.currentOrganizationId!, entries);
      setConflicts(conflictsFound);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load timetable',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateTimetable = async () => {
    if (!selectedClass) {
      toast({
        title: 'Validation Error',
        description: 'Please select a class to generate timetable for',
        variant: 'destructive',
      });
      return;
    }

    try {
      setGenerating(true);
      
      const params: TimetableGenerationParams = {
        organizationId: user!.currentOrganizationId!,
        classId: selectedClass,
        subjects: subjects,
        teachers: teachers.map(t => ({
          id: t.id,
          name: `${t.firstName} ${t.lastName}`,
          subjects: t.subjects || [],
          maxPeriodsPerDay: 6,
          maxPeriodsPerWeek: 25,
        })),
        periodsPerDay: genParams.periodsPerDay || DEFAULT_PERIODS,
        periodDuration: genParams.periodDuration || DEFAULT_PERIOD_DURATION,
        startTime: genParams.startTime || '08:00',
        breakAfterPeriod: genParams.breakAfterPeriod,
        breakDuration: genParams.breakDuration,
        lunchAfterPeriod: genParams.lunchAfterPeriod,
        lunchDuration: genParams.lunchDuration,
        workingDays: genParams.workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        avoidConsecutiveSameSubject: true,
        distributeEvenly: true,
        academicYear: new Date().getFullYear().toString(),
      };

      const generatedEntries = await generateTimetable(params);
      
      toast({
        title: 'Success',
        description: `Generated ${generatedEntries.length} timetable entries`,
      });
      
      setGenerateDialogOpen(false);
      setSelectedEntity(selectedClass);
      setSelectedView('class');
      await loadTimetable();
    } catch (error: any) {
      toast({
        title: 'Generation Failed',
        description: error.message || 'Failed to generate timetable',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleValidateTimetable = async () => {
    try {
      setValidating(true);
      const result = await validateTimetable(user!.currentOrganizationId!, timetableEntries);
      setValidationResult(result);
      
      if (result.isValid) {
        toast({
          title: 'Validation Passed',
          description: 'Timetable is valid with no conflicts',
        });
      } else {
        toast({
          title: 'Validation Issues Found',
          description: `Found ${result.errors.length} errors and ${result.warnings.length} warnings`,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to validate timetable',
        variant: 'destructive',
      });
    } finally {
      setValidating(false);
    }
  };

  const handleExportTimetable = async () => {
    try {
      const exportData = await exportTimetable(user!.currentOrganizationId!, {
        classId: selectedView === 'class' ? selectedEntity : undefined,
        teacherId: selectedView === 'teacher' ? selectedEntity : undefined,
      });
      
      // Create and download CSV
      const blob = new Blob([exportData], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `timetable_${selectedEntity}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Success',
        description: 'Timetable exported successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to export timetable',
        variant: 'destructive',
      });
    }
  };

  const handleOpenEntryDialog = (entry?: TimetableEntry) => {
    if (entry) {
      setEditingEntry(entry);
      setFormData({
        classId: entry.classId,
        subjectId: entry.subjectId,
        teacherId: entry.teacherId,
        dayOfWeek: entry.dayOfWeek as typeof DAYS_OF_WEEK[number],
        period: entry.period,
        startTime: entry.startTime,
        endTime: entry.endTime,
        room: entry.room || '',
      });
    } else {
      setEditingEntry(null);
      setFormData({
        classId: selectedView === 'class' ? selectedEntity : '',
        subjectId: '',
        teacherId: '',
        dayOfWeek: 'Monday',
        period: 1,
        startTime: '08:00',
        endTime: '08:45',
        room: '',
      });
    }
    setEntryDialogOpen(true);
  };

  const handleSaveEntry = async () => {
    try {
      if (!formData.classId || !formData.subjectId || !formData.teacherId) {
        toast({
          title: 'Validation Error',
          description: 'Please fill in all required fields',
          variant: 'destructive',
        });
        return;
      }

      const classInfo = classes.find(c => c.id === formData.classId);
      const teacherInfo = teachers.find(t => t.id === formData.teacherId);
      const subjectInfo = subjects.find(s => s.id === formData.subjectId);

      const entryData: Omit<TimetableEntry, 'id'> = {
        organizationId: user!.currentOrganizationId!,
        classId: formData.classId,
        className: classInfo?.name || '',
        subjectId: formData.subjectId,
        subjectName: subjectInfo?.name || '',
        teacherId: formData.teacherId,
        teacherName: `${teacherInfo?.firstName} ${teacherInfo?.lastName}`,
        dayOfWeek: formData.dayOfWeek,
        period: formData.period,
        startTime: formData.startTime,
        endTime: formData.endTime,
        room: formData.room,
        academicYear: new Date().getFullYear().toString(),
      };

      if (editingEntry) {
        await updateTimetableEntry(editingEntry.id, entryData);
        toast({
          title: 'Success',
          description: 'Timetable entry updated successfully',
        });
      } else {
        await createTimetableEntry(entryData);
        toast({
          title: 'Success',
          description: 'Timetable entry created successfully',
        });
      }

      setEntryDialogOpen(false);
      await loadTimetable();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save timetable entry',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this timetable entry?')) return;

    try {
      await deleteTimetableEntry(entryId);
      toast({
        title: 'Success',
        description: 'Timetable entry deleted successfully',
      });
      await loadTimetable();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete timetable entry',
        variant: 'destructive',
      });
    }
  };

  const renderTimetableGrid = () => {
    const periods = Array.from({ length: genParams.periodsPerDay || DEFAULT_PERIODS }, (_, i) => i + 1);
    const days = genParams.workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Period</TableHead>
              <TableHead className="w-24">Time</TableHead>
              {days.map((day: string) => (
                <TableHead key={day} className="text-center min-w-[150px]">
                  {day}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {periods.map(period => {
              const periodEntries = timetableEntries.filter(e => e.period === period);
              
              return (
                <TableRow key={period}>
                  <TableCell className="font-medium">{period}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {periodEntries[0]?.startTime || '-'}<br />
                    {periodEntries[0]?.endTime || '-'}
                  </TableCell>
                  {days.map((day: string) => {
                    const entry = periodEntries.find(e => e.dayOfWeek === day);
                    const hasConflict = conflicts.some(c => 
                      c.entries.some((ce: TimetableEntry) => ce.id === entry?.id)
                    );

                    return (
                      <TableCell 
                        key={`${day}-${period}`} 
                        className="p-2"
                      >
                        {entry ? (
                          <div 
                            className={`p-2 rounded-lg border-l-4 cursor-pointer hover:shadow-md transition-shadow ${
                              hasConflict 
                                ? 'bg-red-50 border-red-500 dark:bg-red-950' 
                                : 'bg-blue-50 border-blue-500 dark:bg-blue-950'
                            }`}
                            onClick={() => handleOpenEntryDialog(entry)}
                          >
                            <div className="font-semibold text-sm">{entry.subjectName}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {entry.teacherName}
                            </div>
                            {entry.room && (
                              <div className="text-xs text-muted-foreground">
                                Room: {entry.room}
                              </div>
                            )}
                            {hasConflict && (
                              <Badge variant="destructive" className="mt-1 text-xs">
                                Conflict
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <div 
                            className="p-2 rounded-lg border-2 border-dashed border-gray-200 text-center text-xs text-muted-foreground cursor-pointer hover:border-primary hover:bg-muted/50 transition-colors"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                dayOfWeek: day as typeof DAYS_OF_WEEK[number],
                                period,
                              }));
                              handleOpenEntryDialog();
                            }}
                          >
                            + Add
                          </div>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

  if (loading && classes.length === 0) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Timetable Management</h1>
          <p className="text-muted-foreground mt-2">
            Generate and manage class and teacher timetables
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleValidateTimetable} disabled={validating || timetableEntries.length === 0}>
            {validating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Validate
          </Button>
          <Button variant="outline" onClick={handleExportTimetable} disabled={timetableEntries.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/timetable-wizard'}>
            <Wand2 className="h-4 w-4 mr-2" />
            Configuration Wizard
          </Button>
          <Button onClick={() => setGenerateDialogOpen(true)}>
            <CalendarPlus className="h-4 w-4 mr-2" />
            Quick Generate
          </Button>
        </div>
      </div>

      {/* Validation Results */}
      {validationResult && !validationResult.isValid && (
        <Card className="border-yellow-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Validation Issues
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {validationResult.errors.length > 0 && (
              <div>
                <h4 className="font-semibold text-red-600 mb-2">Errors:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {validationResult.errors.map((error: string, idx: number) => (
                    <li key={idx} className="text-sm text-red-600">{error}</li>
                  ))}
                </ul>
              </div>
            )}
            {validationResult.warnings.length > 0 && (
              <div>
                <h4 className="font-semibold text-yellow-600 mb-2">Warnings:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {validationResult.warnings.map((warning: string, idx: number) => (
                    <li key={idx} className="text-sm text-yellow-600">{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Conflicts */}
      {conflicts.length > 0 && (
        <Card className="border-red-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Timetable Conflicts ({conflicts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {conflicts.map((conflict, idx) => (
                <div key={idx} className="p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                  <p className="font-semibold text-red-600">{conflict.type}</p>
                  <p className="text-sm text-muted-foreground mt-1">{conflict.message}</p>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Affected entries: {conflict.entries.map((e: TimetableEntry) => e.subjectName).join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* View Selector and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>View By</Label>
              <Select value={selectedView} onValueChange={(v) => setSelectedView(v as 'class' | 'teacher')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="class">Class View</SelectItem>
                  <SelectItem value="teacher">Teacher View</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>{selectedView === 'class' ? 'Select Class' : 'Select Teacher'}</Label>
              <Select value={selectedEntity} onValueChange={setSelectedEntity}>
                <SelectTrigger>
                  <SelectValue placeholder={`Select ${selectedView}`} />
                </SelectTrigger>
                <SelectContent>
                  {selectedView === 'class' ? (
                    classes.map(cls => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))
                  ) : (
                    teachers.map(teacher => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.firstName} {teacher.lastName}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button variant="outline" onClick={() => handleOpenEntryDialog()} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Entry
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timetable Grid */}
      <Card>
        <CardHeader>
          <CardTitle>
            {selectedView === 'class' 
              ? `Class Timetable: ${classes.find(c => c.id === selectedEntity)?.name || ''}`
              : `Teacher Timetable: ${teachers.find(t => t.id === selectedEntity) ? `${teachers.find(t => t.id === selectedEntity)?.firstName} ${teachers.find(t => t.id === selectedEntity)?.lastName}` : ''}`
            }
          </CardTitle>
          <CardDescription>
            Click on a cell to edit or add a new entry
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-96 w-full" />
          ) : timetableEntries.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium">No timetable entries found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Generate a timetable or add entries manually
              </p>
            </div>
          ) : (
            renderTimetableGrid()
          )}
        </CardContent>
      </Card>

      {/* Generate Timetable Dialog */}
      <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generate Timetable</DialogTitle>
            <DialogDescription>
              Configure parameters for automatic timetable generation
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Class *</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(cls => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Periods Per Day</Label>
                <Input
                  type="number"
                  min="1"
                  max="12"
                  value={genParams.periodsPerDay}
                  onChange={(e) => setGenParams({ ...genParams, periodsPerDay: parseInt(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label>Period Duration (minutes)</Label>
                <Input
                  type="number"
                  min="30"
                  max="120"
                  value={genParams.periodDuration}
                  onChange={(e) => setGenParams({ ...genParams, periodDuration: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Start Time</Label>
              <Input
                type="time"
                value={genParams.startTime}
                onChange={(e) => setGenParams({ ...genParams, startTime: e.target.value })}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Break After Period</Label>
                <Input
                  type="number"
                  min="0"
                  value={genParams.breakAfterPeriod || ''}
                  onChange={(e) => setGenParams({ ...genParams, breakAfterPeriod: parseInt(e.target.value) || undefined })}
                  placeholder="e.g., 3"
                />
              </div>

              <div className="space-y-2">
                <Label>Break Duration (minutes)</Label>
                <Input
                  type="number"
                  min="0"
                  value={genParams.breakDuration || ''}
                  onChange={(e) => setGenParams({ ...genParams, breakDuration: parseInt(e.target.value) || undefined })}
                  placeholder="e.g., 15"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Lunch After Period</Label>
                <Input
                  type="number"
                  min="0"
                  value={genParams.lunchAfterPeriod || ''}
                  onChange={(e) => setGenParams({ ...genParams, lunchAfterPeriod: parseInt(e.target.value) || undefined })}
                  placeholder="e.g., 5"
                />
              </div>

              <div className="space-y-2">
                <Label>Lunch Duration (minutes)</Label>
                <Input
                  type="number"
                  min="0"
                  value={genParams.lunchDuration || ''}
                  onChange={(e) => setGenParams({ ...genParams, lunchDuration: parseInt(e.target.value) || undefined })}
                  placeholder="e.g., 45"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setGenerateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerateTimetable} disabled={generating || !selectedClass}>
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Generate
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Entry Dialog */}
      <Dialog open={entryDialogOpen} onOpenChange={setEntryDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingEntry ? 'Edit Timetable Entry' : 'Add Timetable Entry'}
            </DialogTitle>
            <DialogDescription>
              Enter the details for the timetable entry
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Class *</Label>
                <Select value={formData.classId} onValueChange={(v) => setFormData({ ...formData, classId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map(cls => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Subject *</Label>
                <Select value={formData.subjectId} onValueChange={(v) => setFormData({ ...formData, subjectId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map(subject => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Teacher *</Label>
              <Select value={formData.teacherId} onValueChange={(v) => setFormData({ ...formData, teacherId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map(teacher => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.firstName} {teacher.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Day of Week *</Label>
                <Select value={formData.dayOfWeek} onValueChange={(v) => setFormData({ ...formData, dayOfWeek: v as typeof DAYS_OF_WEEK[number] })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map(day => (
                      <SelectItem key={day} value={day}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Period *</Label>
                <Input
                  type="number"
                  min="1"
                  max={genParams.periodsPerDay || DEFAULT_PERIODS}
                  value={formData.period}
                  onChange={(e) => setFormData({ ...formData, period: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Room</Label>
              <Input
                placeholder="e.g., Room 101, Lab A"
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEntryDialogOpen(false)}>
              Cancel
            </Button>
            {editingEntry && (
              <Button 
                variant="destructive" 
                onClick={() => {
                  handleDeleteEntry(editingEntry.id);
                  setEntryDialogOpen(false);
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
            <Button onClick={handleSaveEntry}>
              {editingEntry ? 'Update Entry' : 'Add Entry'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
