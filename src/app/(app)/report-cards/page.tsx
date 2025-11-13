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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
  FileText, 
  Download, 
  Printer,
  Award,
  TrendingUp,
  Calendar,
  Users,
  BookOpen
} from 'lucide-react';
import { getSchoolClasses } from '@/services/class';
import { getStudentsByOrganization } from '@/services/student';
import { 
  generateReportCard,
  generateClassReportCards,
  type ReportCard 
} from '@/services/report-card';
import { format } from 'date-fns';

export default function ReportCardsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [term, setTerm] = useState<string>('');
  const [academicYear, setAcademicYear] = useState<string>('');
  const [reportCard, setReportCard] = useState<ReportCard | null>(null);
  const [classReportCards, setClassReportCards] = useState<ReportCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [generationMode, setGenerationMode] = useState<'single' | 'class'>('single');

  // Load classes on mount
  useEffect(() => {
    if (user?.currentOrganizationId) {
      loadClasses();
      // Set default academic year to current year
      const currentYear = new Date().getFullYear();
      setAcademicYear(`${currentYear}/${currentYear + 1}`);
    }
  }, [user?.currentOrganizationId]);

  // Load students when class is selected
  useEffect(() => {
    if (selectedClass && user?.currentOrganizationId) {
      loadStudents();
    }
  }, [selectedClass]);

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
        { classFilter: selectedClass }
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

  const handleGenerateSingle = async () => {
    if (!selectedStudent || !term || !academicYear) {
      toast({
        title: 'Validation Error',
        description: 'Please select a student, term, and academic year',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);
      const report = await generateReportCard(selectedStudent, term, academicYear);
      setReportCard(report);
      toast({
        title: 'Success',
        description: 'Report card generated successfully'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate report card',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateClass = async () => {
    if (!selectedClass || !term || !academicYear) {
      toast({
        title: 'Validation Error',
        description: 'Please select a class, term, and academic year',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);
      const reports = await generateClassReportCards(
        selectedClass,
        user!.currentOrganizationId!,
        term,
        academicYear
      );
      setClassReportCards(reports);
      toast({
        title: 'Success',
        description: `Generated ${reports.length} report cards`
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate report cards',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrintReportCard = (report: ReportCard) => {
    // Create a printable HTML version
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(generatePrintHTML(report));
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const generatePrintHTML = (report: ReportCard): string => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Report Card - ${report.studentName}</title>
          <style>
            @page { margin: 1cm; }
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 20px; }
            .school-name { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .report-title { font-size: 18px; margin-bottom: 10px; }
            .student-info { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 30px; }
            .info-item { padding: 5px 0; }
            .info-label { font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; }
            th { background-color: #f0f0f0; font-weight: bold; }
            .summary { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .summary-box { border: 1px solid #000; padding: 15px; }
            .summary-title { font-weight: bold; margin-bottom: 10px; font-size: 14px; }
            .grade-a { background-color: #4ade80; }
            .grade-b { background-color: #60a5fa; }
            .grade-c { background-color: #fbbf24; }
            .grade-d { background-color: #fb923c; }
            .grade-f { background-color: #f87171; }
            .remarks { margin-top: 30px; border-top: 2px solid #000; padding-top: 20px; }
            .signature-section { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 50px; }
            .signature-line { border-top: 1px solid #000; padding-top: 5px; margin-top: 40px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="school-name">${report.schoolName}</div>
            <div class="report-title">STUDENT REPORT CARD</div>
            <div>${report.term} - ${report.academicYear}</div>
          </div>
          
          <div class="student-info">
            <div class="info-item">
              <span class="info-label">Student Name:</span> ${report.studentName}
            </div>
            <div class="info-item">
              <span class="info-label">Student Number:</span> ${report.studentNumber || 'N/A'}
            </div>
            <div class="info-item">
              <span class="info-label">Class:</span> ${report.class}
            </div>
            <div class="info-item">
              <span class="info-label">Report Date:</span> ${format(new Date(report.generatedDate), 'MMM dd, yyyy')}
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Subject</th>
                <th>Score</th>
                <th>Grade</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              ${report.subjects.map(subject => `
                <tr>
                  <td>${subject.subject}</td>
                  <td>${subject.averagePercentage.toFixed(1)}%</td>
                  <td class="grade-${subject.letterGrade.toLowerCase()}">${subject.letterGrade}</td>
                  <td>${subject.remarks}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="summary">
            <div class="summary-box">
              <div class="summary-title">ACADEMIC PERFORMANCE</div>
              <div>Total Subjects: ${report.performance.totalSubjects}</div>
              <div>Average Score: ${report.performance.averagePercentage.toFixed(1)}%</div>
              <div>Overall Grade: ${report.performance.overallGrade}</div>
              <div>Subjects Above 80%: ${report.performance.subjectsAbove80}</div>
              <div>Subjects Below 40%: ${report.performance.subjectsBelow40}</div>
            </div>
            
            <div class="summary-box">
              <div class="summary-title">ATTENDANCE SUMMARY</div>
              <div>Total Days: ${report.attendance.totalDays}</div>
              <div>Days Present: ${report.attendance.daysPresent}</div>
              <div>Days Absent: ${report.attendance.daysAbsent}</div>
              <div>Days Late: ${report.attendance.daysLate}</div>
              <div>Attendance Rate: ${report.attendance.attendancePercentage.toFixed(1)}%</div>
            </div>
          </div>
          
          <div class="remarks">
            <div><strong>Conduct:</strong> ${report.remarks.conduct || 'N/A'}</div>
            <div><strong>Effort:</strong> ${report.remarks.effort || 'N/A'}</div>
            ${report.remarks.classTeacherComment ? `
              <div style="margin-top: 15px;">
                <strong>Class Teacher's Comment:</strong><br/>
                ${report.remarks.classTeacherComment}
              </div>
            ` : ''}
            ${report.remarks.headTeacherComment ? `
              <div style="margin-top: 15px;">
                <strong>Head Teacher's Comment:</strong><br/>
                ${report.remarks.headTeacherComment}
              </div>
            ` : ''}
          </div>
          
          <div class="signature-section">
            <div>
              <div class="signature-line">Class Teacher's Signature</div>
            </div>
            <div>
              <div class="signature-line">Head Teacher's Signature</div>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const getGradeBadge = (grade: string) => {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Report Card Generation</h1>
        <p className="text-muted-foreground mt-2">
          Generate comprehensive academic report cards for students
        </p>
      </div>

      {/* Generation Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Report Cards</CardTitle>
          <CardDescription>Select parameters to generate report cards</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={generationMode} onValueChange={(v) => setGenerationMode(v as 'single' | 'class')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="single">Single Student</TabsTrigger>
              <TabsTrigger value="class">Entire Class</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="class">Class *</Label>
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

            {generationMode === 'single' && (
              <div className="space-y-2">
                <Label htmlFor="student">Student *</Label>
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
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
            )}

            <div className="space-y-2">
              <Label htmlFor="term">Term/Semester *</Label>
              <Select value={term} onValueChange={setTerm}>
                <SelectTrigger id="term">
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Term 1">Term 1</SelectItem>
                  <SelectItem value="Term 2">Term 2</SelectItem>
                  <SelectItem value="Term 3">Term 3</SelectItem>
                  <SelectItem value="Semester 1">Semester 1</SelectItem>
                  <SelectItem value="Semester 2">Semester 2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="academic-year">Academic Year *</Label>
              <Input
                id="academic-year"
                placeholder="e.g., 2024/2025"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            {generationMode === 'single' ? (
              <Button onClick={handleGenerateSingle} disabled={loading}>
                {loading ? 'Generating...' : 'Generate Report Card'}
              </Button>
            ) : (
              <Button onClick={handleGenerateClass} disabled={loading}>
                {loading ? 'Generating...' : 'Generate Class Report Cards'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Single Report Card Display */}
      {reportCard && generationMode === 'single' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Report Card - {reportCard.studentName}</CardTitle>
                <CardDescription>
                  {reportCard.class} | {reportCard.term} - {reportCard.academicYear}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => handlePrintReportCard(reportCard)}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Performance Summary */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Overall Grade</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {getGradeBadge(reportCard.performance.overallGrade)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {reportCard.performance.averagePercentage.toFixed(1)}%
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Subjects</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reportCard.performance.totalSubjects}</div>
                  <p className="text-xs text-muted-foreground">
                    {reportCard.performance.subjectsAbove80} above 80%
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Attendance</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {reportCard.attendance.attendancePercentage.toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {reportCard.attendance.daysPresent}/{reportCard.attendance.totalDays} days
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Conduct</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reportCard.remarks.conduct}</div>
                  <p className="text-xs text-muted-foreground">
                    Effort: {reportCard.remarks.effort}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Subject Grades */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Subject Performance</h3>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Assessments</TableHead>
                      <TableHead>Average Score</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportCard.subjects.map((subject, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{subject.subject}</TableCell>
                        <TableCell>{subject.assessments.length}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{subject.averagePercentage.toFixed(1)}%</div>
                            <div className="text-xs text-muted-foreground">
                              {subject.averageScore.toFixed(1)}/100
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getGradeBadge(subject.letterGrade)}</TableCell>
                        <TableCell>{subject.remarks}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Attendance Details */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Attendance Details</h3>
              <div className="grid gap-4 md:grid-cols-5">
                <div className="border rounded-lg p-4">
                  <div className="text-sm text-muted-foreground">Total Days</div>
                  <div className="text-2xl font-bold">{reportCard.attendance.totalDays}</div>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="text-sm text-muted-foreground">Present</div>
                  <div className="text-2xl font-bold text-green-600">
                    {reportCard.attendance.daysPresent}
                  </div>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="text-sm text-muted-foreground">Absent</div>
                  <div className="text-2xl font-bold text-red-600">
                    {reportCard.attendance.daysAbsent}
                  </div>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="text-sm text-muted-foreground">Late</div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {reportCard.attendance.daysLate}
                  </div>
                </div>
                <div className="border rounded-lg p-4">
                  <div className="text-sm text-muted-foreground">Excused</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {reportCard.attendance.daysExcused}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Class Report Cards Display */}
      {classReportCards.length > 0 && generationMode === 'class' && (
        <Card>
          <CardHeader>
            <CardTitle>Class Report Cards ({classReportCards.length})</CardTitle>
            <CardDescription>
              Generated for {classes.find(c => c.id === selectedClass)?.name} - {term} {academicYear}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Student Number</TableHead>
                    <TableHead>Subjects</TableHead>
                    <TableHead>Average</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Attendance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classReportCards.map((report, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{report.studentName}</TableCell>
                      <TableCell>{report.studentNumber || 'N/A'}</TableCell>
                      <TableCell>{report.performance.totalSubjects}</TableCell>
                      <TableCell>{report.performance.averagePercentage.toFixed(1)}%</TableCell>
                      <TableCell>{getGradeBadge(report.performance.overallGrade)}</TableCell>
                      <TableCell>{report.attendance.attendancePercentage.toFixed(1)}%</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setReportCard(report);
                              setGenerationMode('single');
                            }}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePrintReportCard(report)}
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
