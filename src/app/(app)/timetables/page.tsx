
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
  Plus,
  Edit,
  Trash2,
  Calendar,
  Clock,
  User,
  BookOpen,
  MoreVertical,
  Loader2,
  CalendarPlus,
} from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  getSchoolClasses,
  getSchoolSubjects,
  getSchoolTimetables,
  createTimetableEntry,
  updateTimetableEntry,
  deleteTimetableEntry,
  checkTimetableConflicts,
} from '@/services/class';
import { getTeachers } from '@/services/staff';

interface TimetableEntry {
  id: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  period: number;
  startTime: string;
  endTime: string;
  room?: string;
  academicYear: string;
  isActive: boolean;
}

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
];

const PERIODS = Array.from({ length: 8 }, (_, i) => ({
  value: (i + 1).toString(),
  label: `Period ${i + 1}`,
  time: `${8 + i}:00 - ${9 + i}:00`,
}));

type ClassOption = { id: string; name: string };
type SubjectOption = { id: string; name: string };
type TeacherOption = { id: string; name: string };

export default function TimetablesPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<TimetableEntry | null>(null);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedDay, setSelectedDay] = useState<string>('all');
  const [academicYear, setAcademicYear] = useState('2024/2025');
  const [classOptions, setClassOptions] = useState<ClassOption[]>([]);
  const [subjectOptions, setSubjectOptions] = useState<SubjectOption[]>([]);
  const [teacherOptions, setTeacherOptions] = useState<TeacherOption[]>([]);

  // Create/edit form state
  const [formClassId, setFormClassId] = useState<string>('');
  const [formSubjectId, setFormSubjectId] = useState<string>('');
  const [formTeacherId, setFormTeacherId] = useState<string>('');
  const [formDay, setFormDay] = useState<string>('');
  const [formPeriod, setFormPeriod] = useState<string>('');
  const [formStart, setFormStart] = useState<string>('08:00');
  const [formEnd, setFormEnd] = useState<string>('08:45');
  const [formRoom, setFormRoom] = useState<string>('');

  // Load options and entries
  useEffect(() => {
    async function loadOptions() {
      if (!currentUser?.schoolId) return;
      try {
        const [classes, subjects, teachers] = await Promise.all([
          getSchoolClasses(currentUser.schoolId, academicYear),
          getSchoolSubjects(currentUser.schoolId),
          getTeachers(currentUser.schoolId),
        ]);
        setClassOptions(classes.map(c => ({ id: c.id!, name: c.className })));
        setSubjectOptions(subjects.map(s => ({ id: s.id!, name: s.name })));
        setTeacherOptions(teachers.map(t => ({ id: t.id!, name: t.name })));
      } catch (e) {
        console.error(e);
        toast({ title: 'Error', description: 'Failed to load options', variant: 'destructive' });
      }
    }
    loadOptions();
  }, [currentUser?.schoolId, academicYear, toast]);

  useEffect(() => {
    async function loadEntries() {
      if (!currentUser?.schoolId) return;
      setLoading(true);
      try {
        const entries = await getSchoolTimetables(currentUser.schoolId, {
          classId: selectedClass,
          dayOfWeek: selectedDay,
          academicYear,
        });
        setTimetableEntries(entries as any);
      } catch (e) {
        console.error(e);
        toast({ title: 'Error', description: 'Failed to load timetable', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    }
    loadEntries();
  }, [currentUser?.schoolId, selectedClass, selectedDay, academicYear, toast]);

  const resetForm = () => {
    setFormClassId('');
    setFormSubjectId('');
    setFormTeacherId('');
    setFormDay('');
    setFormPeriod('');
    setFormStart('08:00');
    setFormEnd('08:45');
    setFormRoom('');
  };

  const handleCreateEntry = async () => {
    if (!currentUser?.schoolId) return;
    try {
      if (!formClassId || !formSubjectId || !formTeacherId || !formDay || !formPeriod) {
        toast({ title: 'Missing fields', description: 'Please fill all required fields', variant: 'destructive' });
        return;
      }
      const className = classOptions.find(c => c.id === formClassId)?.name || '';
      const subjectName = subjectOptions.find(s => s.id === formSubjectId)?.name || '';
      const teacherName = teacherOptions.find(t => t.id === formTeacherId)?.name || '';

      const hasConflict = await checkTimetableConflicts(
        currentUser.schoolId,
        formClassId,
        formTeacherId,
        formDay,
        parseInt(formPeriod),
        academicYear
      );
      if (hasConflict) {
        toast({ title: 'Conflict detected', description: 'Class or teacher already scheduled at this time', variant: 'destructive' });
        return;
      }

      const created = await createTimetableEntry({
        schoolId: currentUser.schoolId,
        classId: formClassId,
        className,
        subjectId: formSubjectId,
        subjectName,
        teacherId: formTeacherId,
        teacherName,
        dayOfWeek: formDay as any,
        period: parseInt(formPeriod),
        startTime: formStart,
        endTime: formEnd,
        room: formRoom || undefined,
        academicYear,
        isActive: true,
      });
      setTimetableEntries(prev => [...prev, created as any]);
      toast({ title: 'Success', description: 'Timetable entry created successfully' });
      setCreateDialogOpen(false);
      resetForm();
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Error', description: e.message || 'Failed to create entry', variant: 'destructive' });
    }
  };

  const handleEditEntry = async () => {
    if (!currentUser?.schoolId || !selectedEntry) return;
    try {
      const hasConflict = await checkTimetableConflicts(
        currentUser.schoolId,
        formClassId || selectedEntry.classId,
        formTeacherId || selectedEntry.teacherId,
        formDay || selectedEntry.dayOfWeek,
        parseInt(formPeriod || selectedEntry.period.toString()),
        academicYear,
        selectedEntry.id
      );
      if (hasConflict) {
        toast({ title: 'Conflict detected', description: 'Class or teacher already scheduled at this time', variant: 'destructive' });
        return;
      }

      const updates: any = {
        classId: formClassId || selectedEntry.classId,
        className: formClassId ? (classOptions.find(c => c.id === formClassId)?.name || selectedEntry.className) : selectedEntry.className,
        subjectId: formSubjectId || selectedEntry.subjectId,
        subjectName: formSubjectId ? (subjectOptions.find(s => s.id === formSubjectId)?.name || selectedEntry.subjectName) : selectedEntry.subjectName,
        teacherId: formTeacherId || selectedEntry.teacherId,
        teacherName: formTeacherId ? (teacherOptions.find(t => t.id === formTeacherId)?.name || selectedEntry.teacherName) : selectedEntry.teacherName,
        dayOfWeek: (formDay || selectedEntry.dayOfWeek) as any,
        period: parseInt(formPeriod || selectedEntry.period.toString()),
        startTime: formStart || selectedEntry.startTime,
        endTime: formEnd || selectedEntry.endTime,
        room: formRoom || selectedEntry.room || undefined,
        academicYear,
        isActive: true,
      };

      await updateTimetableEntry(selectedEntry.id, updates);
      setTimetableEntries(prev => prev.map(e => (e.id === selectedEntry.id ? { ...e, ...updates } : e)));
      toast({ title: 'Success', description: 'Timetable entry updated successfully' });
      setEditDialogOpen(false);
      setSelectedEntry(null);
      resetForm();
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Error', description: e.message || 'Failed to update entry', variant: 'destructive' });
    }
  };

  const handleDeleteEntry = async () => {
    if (!selectedEntry) return;
    try {
      await deleteTimetableEntry(selectedEntry.id);
      setTimetableEntries(prev => prev.filter(e => e.id !== selectedEntry.id));
      toast({ title: 'Success', description: 'Timetable entry deleted successfully' });
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Error', description: e.message || 'Failed to delete entry', variant: 'destructive' });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedEntry(null);
    }
  };

  const openEditDialog = (entry: TimetableEntry) => {
    setSelectedEntry(entry);
    // seed form with existing values
    setFormClassId(entry.classId);
    setFormSubjectId(entry.subjectId);
    setFormTeacherId(entry.teacherId);
    setFormDay(entry.dayOfWeek);
    setFormPeriod(entry.period.toString());
    setFormStart(entry.startTime);
    setFormEnd(entry.endTime);
    setFormRoom(entry.room || '');
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (entry: TimetableEntry) => {
    setSelectedEntry(entry);
    setDeleteDialogOpen(true);
  };

  const filteredEntries = timetableEntries.filter(entry => {
    const matchesClass = selectedClass === 'all' || entry.classId === selectedClass;
    const matchesDay = selectedDay === 'all' || entry.dayOfWeek === selectedDay;
    return matchesClass && matchesDay;
  });

  const getTimetableByDay = (day: string) => {
    return filteredEntries.filter(entry => entry.dayOfWeek === day);
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
        title="Timetable Management"
        description="Create, manage, and view school timetables."
        actions={
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <CalendarPlus className="mr-2 h-4 w-4" />
                Create Timetable Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Timetable Entry</DialogTitle>
                <DialogDescription>
                  Add a new subject period to the school timetable.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Class</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classOptions.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <Select value={formSubjectId} onValueChange={setFormSubjectId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjectOptions.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Teacher</Label>
                    <Select value={formTeacherId} onValueChange={setFormTeacherId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select teacher" />
                      </SelectTrigger>
                      <SelectContent>
                        {teacherOptions.map((teacher) => (
                          <SelectItem key={teacher.id} value={teacher.id}>
                            {teacher.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Day of Week</Label>
                    <Select value={formDay} onValueChange={setFormDay}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select day" />
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS_OF_WEEK.map((day) => (
                          <SelectItem key={day.value} value={day.value}>
                            {day.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Period</Label>
                    <Select value={formPeriod} onValueChange={setFormPeriod}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                      <SelectContent>
                        {PERIODS.map((period) => (
                          <SelectItem key={period.value} value={period.value}>
                            {period.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input type="time" value={formStart} onChange={e => setFormStart(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input type="time" value={formEnd} onChange={e => setFormEnd(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Room (Optional)</Label>
                  <Input placeholder="e.g., Room 101" value={formRoom} onChange={e => setFormRoom(e.target.value)} />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateEntry}>Create Entry</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Timetable Filters</CardTitle>
          <CardDescription>
            Filter timetable entries by class and day
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label>Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classOptions.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label>Day</Label>
              <Select value={selectedDay} onValueChange={setSelectedDay}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Days</SelectItem>
                  {DAYS_OF_WEEK.map((day) => (
                    <SelectItem key={day.value} value={day.value}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label>Academic Year</Label>
              <Select value={academicYear} onValueChange={setAcademicYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024/2025">2024/2025</SelectItem>
                  <SelectItem value="2025/2026">2025/2026</SelectItem>
                  <SelectItem value="2026/2027">2026/2027</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timetable Views */}
      <Tabs defaultValue="weekly" className="space-y-4">
        <TabsList>
          <TabsTrigger value="weekly">Weekly View</TabsTrigger>
          <TabsTrigger value="daily">Daily View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>

        <TabsContent value="weekly" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {DAYS_OF_WEEK.slice(0, 5).map((day) => (
              <Card key={day.value}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg capitalize">{day.label}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {getTimetableByDay(day.value).length === 0 ? (
                    <p className="text-sm text-muted-foreground">No classes scheduled</p>
                  ) : (
                    getTimetableByDay(day.value)
                      .sort((a, b) => a.period - b.period)
                      .map((entry) => (
                        <div key={entry.id} className="p-2 bg-muted rounded text-sm">
                          <div className="font-medium">{entry.subjectName}</div>
                          <div className="text-muted-foreground">
                            {entry.startTime} - {entry.endTime}
                          </div>
                          <div className="text-muted-foreground">
                            {entry.teacherName} • {entry.room}
                          </div>
                        </div>
                      ))
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="daily" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Schedule</CardTitle>
              <CardDescription>
                Detailed view of classes for {selectedDay === 'all' ? 'all days' : DAYS_OF_WEEK.find(d => d.value === selectedDay)?.label}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {PERIODS.map((period) => {
                  const entriesForPeriod = filteredEntries.filter(entry => entry.period === parseInt(period.value));
                  return (
                    <div key={period.value} className="flex items-center gap-4 p-2 border rounded">
                      <div className="w-24 text-sm font-medium">
                        Period {period.value}
                      </div>
                      <div className="w-20 text-sm text-muted-foreground">
                        {period.time}
                      </div>
                      <div className="flex-1">
                        {entriesForPeriod.length === 0 ? (
                          <span className="text-muted-foreground">No class scheduled</span>
                        ) : (
                          <div className="space-y-1">
                            {entriesForPeriod.map((entry) => (
                              <div key={entry.id} className="flex items-center justify-between bg-muted p-2 rounded">
                                <div>
                                  <span className="font-medium">{entry.subjectName}</span>
                                  <span className="text-muted-foreground ml-2">
                                    {entry.className} • {entry.teacherName}
                                  </span>
                                </div>
                                <Badge variant="outline">{entry.room}</Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Timetable Entries</CardTitle>
              <CardDescription>
                Complete list of all timetable entries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Class</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Teacher</TableHead>
                      <TableHead>Day</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEntries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No timetable entries found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredEntries.map((entry) => (
                        <TableRow key={entry.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">{entry.className}</TableCell>
                          <TableCell>{entry.subjectName}</TableCell>
                          <TableCell>{entry.teacherName}</TableCell>
                          <TableCell className="capitalize">{entry.dayOfWeek}</TableCell>
                          <TableCell>Period {entry.period}</TableCell>
                          <TableCell>{entry.startTime} - {entry.endTime}</TableCell>
                          <TableCell>{entry.room || 'N/A'}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditDialog(entry)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Entry
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => openDeleteDialog(entry)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Entry
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
        </TabsContent>
      </Tabs>

      {/* Edit Entry Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Timetable Entry</DialogTitle>
            <DialogDescription>
              Update timetable entry details.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Class</Label>
                <Select defaultValue={selectedEntry?.classId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {classOptions.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Subject</Label>
                <Select defaultValue={selectedEntry?.subjectName}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {subjectOptions.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Teacher</Label>
                <Select defaultValue={selectedEntry?.teacherId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {teacherOptions.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Day of Week</Label>
                <Select defaultValue={selectedEntry?.dayOfWeek}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map((day) => (
                      <SelectItem key={day.value} value={day.value}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Period</Label>
                <Select defaultValue={selectedEntry?.period?.toString()}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PERIODS.map((period) => (
                      <SelectItem key={period.value} value={period.value}>
                        {period.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input type="time" defaultValue={selectedEntry?.startTime} />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input type="time" defaultValue={selectedEntry?.endTime} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Room (Optional)</Label>
              <Input defaultValue={selectedEntry?.room} placeholder="e.g., Room 101" />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditEntry}>Update Entry</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Timetable Entry?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this timetable entry? This action cannot be undone.
          </AlertDialogDescription>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEntry}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Entry
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
