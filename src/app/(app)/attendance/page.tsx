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
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText,
  Download,
  Users,
  TrendingUp
} from 'lucide-react';
import { getSchoolClasses } from '@/services/class';
import { getStudentsByOrganization } from '@/services/student';
import { 
  getAttendanceByDate, 
  markBulkAttendance, 
  updateAttendance,
  getStudentAttendance,
  type Attendance,
  type BulkAttendanceData 
} from '@/services/attendance';
import { format, startOfMonth, endOfMonth } from 'date-fns';

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

interface StudentAttendanceData {
  studentId: string;
  studentName: string;
  class: string;
  status: AttendanceStatus;
  absenceReason?: string;
  notes?: string;
}

export default function AttendancePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [attendanceData, setAttendanceData] = useState<Map<string, StudentAttendanceData>>(new Map());
  const [existingRecords, setExistingRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    total: 0
  });
  
  // Dialog states
  const [selectedStudent, setSelectedStudent] = useState<StudentAttendanceData | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [absenceReason, setAbsenceReason] = useState('');
  const [notes, setNotes] = useState('');

  // Load classes on mount
  useEffect(() => {
    if (user?.currentOrganizationId) {
      loadClasses();
    }
  }, [user?.currentOrganizationId]);

  // Load students when class is selected
  useEffect(() => {
    if (selectedClass && user?.currentOrganizationId) {
      loadStudents();
    }
  }, [selectedClass, user?.currentOrganizationId]);

  // Load attendance when date or class changes
  useEffect(() => {
    if (selectedClass && selectedDate && user?.currentOrganizationId) {
      loadAttendance();
    }
  }, [selectedClass, selectedDate, user?.currentOrganizationId]);

  // Update stats when attendance data changes
  useEffect(() => {
    calculateStats();
  }, [attendanceData]);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const classData = await getSchoolClasses(user!.currentOrganizationId!);
      setClasses(classData);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load classes',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      setLoading(true);
      const studentData = await getStudentsByOrganization(user!.currentOrganizationId!, { classFilter: selectedClass });
      setStudents(studentData);
      
      // Initialize attendance data for all students
      const newAttendanceData = new Map<string, StudentAttendanceData>();
      studentData.forEach((student: any) => {
        newAttendanceData.set(student.id, {
          studentId: student.id,
          studentName: `${student.firstName} ${student.lastName}`,
          class: selectedClass,
          status: 'present', // Default to present
          absenceReason: '',
          notes: ''
        });
      });
      setAttendanceData(newAttendanceData);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load students',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAttendance = async () => {
    try {
      setLoading(true);
      const records = await getAttendanceByDate(
        user!.currentOrganizationId!,
        selectedDate,
        selectedClass
      );
      setExistingRecords(records);
      
      // Update attendance data with existing records
      const updatedData = new Map(attendanceData);
      records.forEach(record => {
        if (updatedData.has(record.studentId)) {
          updatedData.set(record.studentId, {
            studentId: record.studentId,
            studentName: record.studentName || '',
            class: record.class || selectedClass,
            status: record.present ? 'present' : 
                    record.absenceReason === 'Late' ? 'late' :
                    record.absenceReason === 'Excused' ? 'excused' : 'absent',
            absenceReason: record.absenceReason || '',
            notes: record.notes || ''
          });
        }
      });
      setAttendanceData(updatedData);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load attendance',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const data = Array.from(attendanceData.values());
    setStats({
      present: data.filter(d => d.status === 'present').length,
      absent: data.filter(d => d.status === 'absent').length,
      late: data.filter(d => d.status === 'late').length,
      excused: data.filter(d => d.status === 'excused').length,
      total: data.length
    });
  };

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    const updatedData = new Map(attendanceData);
    const current = updatedData.get(studentId);
    if (current) {
      updatedData.set(studentId, {
        ...current,
        status,
        absenceReason: status === 'absent' ? current.absenceReason : 
                       status === 'late' ? 'Late' :
                       status === 'excused' ? 'Excused' : '',
        notes: status === 'present' ? '' : current.notes
      });
      setAttendanceData(updatedData);
    }
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    const updatedData = new Map(attendanceData);
    updatedData.forEach((value, key) => {
      updatedData.set(key, {
        ...value,
        status,
        absenceReason: status === 'absent' ? '' :
                       status === 'late' ? 'Late' :
                       status === 'excused' ? 'Excused' : '',
        notes: status === 'present' ? '' : value.notes
      });
    });
    setAttendanceData(updatedData);
  };

  const handleOpenDetailsDialog = (studentId: string) => {
    const data = attendanceData.get(studentId);
    if (data) {
      setSelectedStudent(data);
      setAbsenceReason(data.absenceReason || '');
      setNotes(data.notes || '');
      setDialogOpen(true);
    }
  };

  const handleSaveDetails = () => {
    if (selectedStudent) {
      const updatedData = new Map(attendanceData);
      updatedData.set(selectedStudent.studentId, {
        ...selectedStudent,
        absenceReason,
        notes
      });
      setAttendanceData(updatedData);
      setDialogOpen(false);
      setSelectedStudent(null);
      setAbsenceReason('');
      setNotes('');
    }
  };

  const handleSaveAttendance = async () => {
    try {
      setSaving(true);
      
      const bulkData: BulkAttendanceData[] = Array.from(attendanceData.values()).map(data => ({
        studentId: data.studentId,
        studentName: data.studentName,
        class: data.class,
        present: data.status === 'present',
        absenceReason: data.status === 'absent' ? (data.absenceReason || 'Absent') :
                       data.status === 'late' ? 'Late' :
                       data.status === 'excused' ? 'Excused' : undefined,
        notes: data.notes
      }));

      await markBulkAttendance(user!.currentOrganizationId!, selectedDate, bulkData);
      
      toast({
        title: 'Success',
        description: 'Attendance saved successfully'
      });
      
      // Reload attendance to get updated records
      await loadAttendance();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save attendance',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: AttendanceStatus) => {
    const variants = {
      present: { variant: 'default' as const, icon: CheckCircle2, label: 'Present', color: 'text-green-600' },
      absent: { variant: 'destructive' as const, icon: XCircle, label: 'Absent', color: 'text-red-600' },
      late: { variant: 'secondary' as const, icon: Clock, label: 'Late', color: 'text-yellow-600' },
      excused: { variant: 'outline' as const, icon: FileText, label: 'Excused', color: 'text-blue-600' }
    };
    
    const config = variants[status];
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const selectedClassName = classes.find(c => c.id === selectedClass)?.name || '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Attendance Management</h1>
        <p className="text-muted-foreground mt-2">
          Mark and track student attendance for your classes
        </p>
      </div>

      {/* Stats Cards */}
      {selectedClass && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Present</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.present}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total > 0 ? ((stats.present / stats.total) * 100).toFixed(1) : 0}%
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Absent</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total > 0 ? ((stats.absent / stats.total) * 100).toFixed(1) : 0}%
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Late</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.late}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total > 0 ? ((stats.late / stats.total) * 100).toFixed(1) : 0}%
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Excused</CardTitle>
              <FileText className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.excused}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total > 0 ? ((stats.excused / stats.total) * 100).toFixed(1) : 0}%
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Attendance Marking Card */}
      <Card>
        <CardHeader>
          <CardTitle>Mark Attendance</CardTitle>
          <CardDescription>Select a class and date to mark attendance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="class">Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger id="class">
                  <SelectValue placeholder="Select a class" />
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
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>
          </div>

          {/* Quick Actions */}
          {selectedClass && (
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleMarkAll('present')}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark All Present
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleMarkAll('absent')}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Mark All Absent
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleMarkAll('late')}
              >
                <Clock className="h-4 w-4 mr-2" />
                Mark All Late
              </Button>
            </div>
          )}

          {/* Student List */}
          {selectedClass && (
            <>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : students.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No students found in this class
                </div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Roll Number</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map(student => {
                        const data = attendanceData.get(student.id);
                        if (!data) return null;
                        
                        return (
                          <TableRow key={student.id}>
                            <TableCell className="font-medium">
                              {student.firstName} {student.lastName}
                            </TableCell>
                            <TableCell>{student.rollNumber || '-'}</TableCell>
                            <TableCell>
                              <Select
                                value={data.status}
                                onValueChange={(value) => 
                                  handleStatusChange(student.id, value as AttendanceStatus)
                                }
                              >
                                <SelectTrigger className="w-[150px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="present">Present</SelectItem>
                                  <SelectItem value="absent">Absent</SelectItem>
                                  <SelectItem value="late">Late</SelectItem>
                                  <SelectItem value="excused">Excused</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenDetailsDialog(student.id)}
                              >
                                Add Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              {students.length > 0 && (
                <div className="flex justify-end">
                  <Button
                    onClick={handleSaveAttendance}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Attendance'}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Attendance Details</DialogTitle>
            <DialogDescription>
              Add additional information for {selectedStudent?.studentName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Absence Reason</Label>
              <Input
                id="reason"
                value={absenceReason}
                onChange={(e) => setAbsenceReason(e.target.value)}
                placeholder="e.g., Sick, Family emergency"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveDetails}>
              Save Details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
