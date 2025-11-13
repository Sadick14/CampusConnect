'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  FileText,
  Download,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Loader2,
  BarChart3,
  GraduationCap,
  ClipboardCheck,
} from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import {
  generateStudentPerformanceReport,
  generateClassPerformanceReport,
  generateFeeCollectionReport,
} from '@/services/reports';
import type { StudentPerformanceReport, ClassPerformanceReport, FeeCollectionReport } from '@/schemas/report';
import { formatGHS } from '@/schemas/subscription';

export default function ReportsPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Student Performance Report State
  const [studentId, setStudentId] = useState('');
  const [studentReport, setStudentReport] = useState<StudentPerformanceReport | null>(null);
  
  // Class Performance Report State
  const [classId, setClassId] = useState('');
  const [classReport, setClassReport] = useState<ClassPerformanceReport | null>(null);
  
  // Fee Collection Report State
  const [feeReport, setFeeReport] = useState<FeeCollectionReport | null>(null);
  
  // Common filters
  const [academicYear, setAcademicYear] = useState('2024-2025');
  const [term, setTerm] = useState('Term 1');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleGenerateStudentReport = async () => {
    if (!currentUser?.currentOrganizationId || !studentId) {
      toast({
        title: 'Missing Information',
        description: 'Please enter a student ID',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const report = await generateStudentPerformanceReport(
        currentUser.currentOrganizationId,
        studentId,
        { academicYear, term }
      );
      
      if (report) {
        setStudentReport(report);
        toast({
          title: 'Report Generated',
          description: 'Student performance report generated successfully',
        });
      } else {
        toast({
          title: 'Student Not Found',
          description: 'No data found for this student',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error generating student report:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate report',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateClassReport = async () => {
    if (!currentUser?.currentOrganizationId || !classId) {
      toast({
        title: 'Missing Information',
        description: 'Please enter a class ID',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const report = await generateClassPerformanceReport(
        currentUser.currentOrganizationId,
        classId,
        { academicYear, term }
      );
      
      if (report) {
        setClassReport(report);
        toast({
          title: 'Report Generated',
          description: 'Class performance report generated successfully',
        });
      } else {
        toast({
          title: 'Class Not Found',
          description: 'No data found for this class',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error generating class report:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate report',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateFeeReport = async () => {
    if (!currentUser?.currentOrganizationId) {
      return;
    }

    setLoading(true);
    try {
      const report = await generateFeeCollectionReport(
        currentUser.currentOrganizationId,
        { startDate, endDate }
      );
      
      setFeeReport(report);
      toast({
        title: 'Report Generated',
        description: 'Fee collection report generated successfully',
      });
    } catch (error) {
      console.error('Error generating fee report:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate report',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Reports & Analytics"
        description="Generate comprehensive reports for academic performance, attendance, and finances"
      />

      <Tabs defaultValue="student" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="student">
            <GraduationCap className="h-4 w-4 mr-2" />
            Student
          </TabsTrigger>
          <TabsTrigger value="class">
            <Users className="h-4 w-4 mr-2" />
            Class
          </TabsTrigger>
          <TabsTrigger value="fees">
            <DollarSign className="h-4 w-4 mr-2" />
            Fees
          </TabsTrigger>
          <TabsTrigger value="attendance">
            <ClipboardCheck className="h-4 w-4 mr-2" />
            Attendance
          </TabsTrigger>
        </TabsList>

        {/* Student Performance Report */}
        <TabsContent value="student" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Student Performance Report</CardTitle>
              <CardDescription>
                Generate a comprehensive performance report for an individual student
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Student ID</Label>
                  <Input
                    placeholder="Enter student ID"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Academic Year</Label>
                  <Input
                    placeholder="e.g., 2024-2025"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Term</Label>
                  <Select value={term} onValueChange={setTerm}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Term 1">Term 1</SelectItem>
                      <SelectItem value="Term 2">Term 2</SelectItem>
                      <SelectItem value="Term 3">Term 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleGenerateStudentReport} disabled={loading}>
                {loading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</>
                ) : (
                  <><BarChart3 className="h-4 w-4 mr-2" />Generate Report</>
                )}
              </Button>
            </CardContent>
          </Card>

          {studentReport && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Report: {studentReport.studentName}</CardTitle>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Student Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Class</p>
                    <p className="font-semibold">{studentReport.className}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Overall Average</p>
                    <p className="font-semibold text-2xl">{studentReport.overallAverage}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Grade</p>
                    <p className="font-semibold text-2xl">{studentReport.overallGrade}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Attendance</p>
                    <p className="font-semibold text-2xl">{studentReport.attendance.percentage}%</p>
                  </div>
                </div>

                {/* Subjects */}
                <div>
                  <h4 className="font-semibold mb-3">Subject Performance</h4>
                  <div className="space-y-2">
                    {studentReport.subjects.map((subject, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{subject.name}</p>
                          <p className="text-sm text-muted-foreground">Teacher: {subject.teacher}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">{subject.averageScore}%</p>
                          <p className="text-sm">Grade: {subject.grade}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Attendance Details */}
                <div>
                  <h4 className="font-semibold mb-3">Attendance Summary</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Days</p>
                      <p className="font-bold text-xl">{studentReport.attendance.totalDays}</p>
                    </div>
                    <div className="p-3 border rounded-lg bg-green-50 dark:bg-green-950">
                      <p className="text-sm text-muted-foreground">Present</p>
                      <p className="font-bold text-xl text-green-600">{studentReport.attendance.present}</p>
                    </div>
                    <div className="p-3 border rounded-lg bg-red-50 dark:bg-red-950">
                      <p className="text-sm text-muted-foreground">Absent</p>
                      <p className="font-bold text-xl text-red-600">{studentReport.attendance.absent}</p>
                    </div>
                  </div>
                </div>

                {/* Conduct */}
                <div>
                  <h4 className="font-semibold mb-3">Conduct & Behavior</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Punctuality</p>
                      <p className="font-medium">{studentReport.conduct.punctuality}</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Behavior</p>
                      <p className="font-medium">{studentReport.conduct.behavior}</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Participation</p>
                      <p className="font-medium">{studentReport.conduct.participation}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Class Performance Report */}
        <TabsContent value="class" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Class Performance Report</CardTitle>
              <CardDescription>
                Generate a performance overview for an entire class
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Class ID</Label>
                  <Input
                    placeholder="Enter class ID"
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Academic Year</Label>
                  <Input
                    placeholder="e.g., 2024-2025"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Term</Label>
                  <Select value={term} onValueChange={setTerm}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Term 1">Term 1</SelectItem>
                      <SelectItem value="Term 2">Term 2</SelectItem>
                      <SelectItem value="Term 3">Term 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleGenerateClassReport} disabled={loading}>
                {loading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</>
                ) : (
                  <><BarChart3 className="h-4 w-4 mr-2" />Generate Report</>
                )}
              </Button>
            </CardContent>
          </Card>

          {classReport && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Class Report: {classReport.className}</CardTitle>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Class Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Students</p>
                    <p className="font-bold text-2xl">{classReport.studentCount}</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Class Average</p>
                    <p className="font-bold text-2xl">{classReport.overallAverage}%</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Attendance Rate</p>
                    <p className="font-bold text-2xl">{classReport.attendanceRate}%</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Subjects</p>
                    <p className="font-bold text-2xl">{classReport.subjects.length}</p>
                  </div>
                </div>

                {/* Subject Performance */}
                <div>
                  <h4 className="font-semibold mb-3">Subject Performance</h4>
                  <div className="space-y-2">
                    {classReport.subjects.map((subject, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium">{subject.name}</h5>
                          <p className="font-bold text-lg">{subject.averageScore}%</p>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">Highest</p>
                            <p className="font-semibold">{subject.highestScore}%</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Lowest</p>
                            <p className="font-semibold">{subject.lowestScore}%</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Pass Rate</p>
                            <p className="font-semibold">{subject.passRate}%</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Students</p>
                            <p className="font-semibold">{subject.studentsCount}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Fee Collection Report */}
        <TabsContent value="fees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fee Collection Report</CardTitle>
              <CardDescription>
                Generate a comprehensive fee collection and payment analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={handleGenerateFeeReport} disabled={loading}>
                {loading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</>
                ) : (
                  <><BarChart3 className="h-4 w-4 mr-2" />Generate Report</>
                )}
              </Button>
            </CardContent>
          </Card>

          {feeReport && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Fee Collection Report</CardTitle>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                </div>
                <CardDescription>Period: {feeReport.period}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Overall Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Expected</p>
                    <p className="font-bold text-xl">{formatGHS(feeReport.overallSummary.totalExpected)}</p>
                  </div>
                  <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950">
                    <p className="text-sm text-muted-foreground">Total Collected</p>
                    <p className="font-bold text-xl text-green-600">{formatGHS(feeReport.overallSummary.totalCollected)}</p>
                  </div>
                  <div className="p-4 border rounded-lg bg-red-50 dark:bg-red-950">
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="font-bold text-xl text-red-600">{formatGHS(feeReport.overallSummary.totalPending)}</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Collection Rate</p>
                    <p className="font-bold text-xl">{feeReport.overallSummary.collectionRate}%</p>
                  </div>
                </div>

                {/* Class Breakdown */}
                <div>
                  <h4 className="font-semibold mb-3">Collection by Class</h4>
                  <div className="space-y-2">
                    {feeReport.classBreakdown.map((classData, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium">{classData.className}</h5>
                          <p className="font-bold">{classData.collectionRate}%</p>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">Expected</p>
                            <p className="font-semibold">{formatGHS(classData.totalExpected)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Collected</p>
                            <p className="font-semibold text-green-600">{formatGHS(classData.totalCollected)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Pending</p>
                            <p className="font-semibold text-red-600">{formatGHS(classData.totalPending)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Defaulters List */}
                {feeReport.defaulters.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Fee Defaulters (Top 20)</h4>
                    <div className="space-y-2">
                      {feeReport.defaulters.map((defaulter, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{defaulter.studentName}</p>
                            <p className="text-sm text-muted-foreground">{defaulter.className}</p>
                          </div>
                          <p className="font-bold text-red-600">{formatGHS(defaulter.amountDue)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Attendance Report - Placeholder */}
        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Report</CardTitle>
              <CardDescription>
                Coming soon - Attendance analytics and trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">This feature is under development.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
