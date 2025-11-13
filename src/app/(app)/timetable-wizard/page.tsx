'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Wand2,
  Plus,
  Trash2,
  Save,
  ArrowRight,
  ArrowLeft,
  Clock,
  Users,
  BookOpen,
  Calendar,
  Settings,
  Check,
  AlertCircle,
} from 'lucide-react';
import {
  generateComprehensiveTimetable,
  saveTimetableConfiguration,
  getTimetableConfiguration,
  type TimetableConfiguration,
  type TeacherConfig,
  type SubjectConfig,
  type ClassConfig,
  type ActivityType,
  type TeacherType,
} from '@/services/timetable';
import { getSchoolClasses } from '@/services/class';
import { getTeachers } from '@/services/staff';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const ACTIVITY_TYPES: { value: ActivityType; label: string }[] = [
  { value: 'subject', label: 'Subject' },
  { value: 'pe', label: 'Physical Education' },
  { value: 'cocurricular', label: 'Co-Curricular' },
  { value: 'assembly', label: 'Assembly' },
];

export default function TimetableWizardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Configuration state
  const [config, setConfig] = useState<Partial<TimetableConfiguration>>({
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    periodsPerDay: 8,
    periodDuration: 45,
    schoolStartTime: '08:00',
    schoolEndTime: '15:00',
    breaks: [
      { name: 'Short Break', afterPeriod: 2, duration: 15, type: 'break' },
      { name: 'Lunch Break', afterPeriod: 4, duration: 45, type: 'lunch' },
    ],
    teachers: [],
    classes: [],
    subjects: [],
    specialActivities: [],
    constraints: {
      avoidConsecutiveSameSubject: true,
      distributeSubjectsEvenly: true,
      maxConsecutivePeriods: 2,
      allowGaps: false,
      prioritizeTeacherPreferences: true,
    },
  });

  // Form states for adding items
  const [newTeacher, setNewTeacher] = useState<Partial<TeacherConfig>>({
    name: '',
    type: 'subject_teacher',
    subjects: [],
    maxPeriodsPerDay: 6,
    maxPeriodsPerWeek: 25,
  });

  const [newSubject, setNewSubject] = useState<Partial<SubjectConfig>>({
    name: '',
    periodsPerWeek: 5,
    category: 'subject',
    occursDaily: false,
    preferMorning: false,
    requiresDoublePeriod: false,
  });

  const [newClass, setNewClass] = useState<Partial<ClassConfig>>({
    name: '',
    teachingType: 'subject_based',
    subjects: [],
  });

  useEffect(() => {
    if (user?.currentOrganizationId) {
      loadExistingConfiguration();
      loadExistingData();
    }
  }, [user?.currentOrganizationId]);

  const loadExistingConfiguration = async () => {
    try {
      const academicYear = new Date().getFullYear().toString();
      const existingConfig = await getTimetableConfiguration(
        user!.currentOrganizationId!,
        academicYear
      );

      if (existingConfig) {
        setConfig(existingConfig);
        toast({
          title: 'Configuration Loaded',
          description: 'Loaded existing timetable configuration',
        });
      }
    } catch (error: any) {
      console.log('No existing configuration found');
    }
  };

  const loadExistingData = async () => {
    try {
      setLoading(true);
      const [classesData, teachersData] = await Promise.all([
        getSchoolClasses(user!.currentOrganizationId!),
        getTeachers(user!.currentOrganizationId!),
      ]);

      // Pre-populate classes if not already configured
      if ((!config.classes || config.classes.length === 0) && classesData.length > 0) {
        const classes: ClassConfig[] = classesData.map((c: any) => ({
          id: c.id,
          name: c.className || c.name || 'Unknown',
          teachingType: 'subject_based',
          subjects: [],
        }));
        setConfig(prev => ({ ...prev, classes }));
      }

      // Pre-populate teachers if not already configured
      if ((!config.teachers || config.teachers.length === 0) && teachersData.length > 0) {
        const teachers: TeacherConfig[] = teachersData.map((t: any) => ({
          id: t.id,
          name: t.name || 'Unknown',
          type: 'subject_teacher' as TeacherType,
          subjects: t.subjects || [],
          maxPeriodsPerDay: 6,
          maxPeriodsPerWeek: 25,
        }));
        setConfig(prev => ({ ...prev, teachers, totalTeachers: teachers.length }));
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load existing data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeacher = () => {
    if (!newTeacher.name) {
      toast({
        title: 'Validation Error',
        description: 'Please enter teacher name',
        variant: 'destructive',
      });
      return;
    }

    const teacher: TeacherConfig = {
      id: `teacher_${Date.now()}`,
      name: newTeacher.name!,
      type: newTeacher.type || 'subject_teacher',
      subjects: newTeacher.subjects || [],
      maxPeriodsPerDay: newTeacher.maxPeriodsPerDay || 6,
      maxPeriodsPerWeek: newTeacher.maxPeriodsPerWeek || 25,
      preferredDays: newTeacher.preferredDays,
      classIds: newTeacher.classIds,
    };

    setConfig(prev => ({
      ...prev,
      teachers: [...(prev.teachers || []), teacher],
      totalTeachers: (prev.totalTeachers || 0) + 1,
    }));

    setNewTeacher({
      name: '',
      type: 'subject_teacher',
      subjects: [],
      maxPeriodsPerDay: 6,
      maxPeriodsPerWeek: 25,
    });

    toast({
      title: 'Success',
      description: 'Teacher added successfully',
    });
  };

  const handleAddSubject = () => {
    if (!newSubject.name) {
      toast({
        title: 'Validation Error',
        description: 'Please enter subject name',
        variant: 'destructive',
      });
      return;
    }

    const subject: SubjectConfig = {
      id: newSubject.name!.toLowerCase().replace(/\s+/g, '_'),
      name: newSubject.name!,
      periodsPerWeek: newSubject.periodsPerWeek || 5,
      category: newSubject.category || 'subject',
      occursDaily: newSubject.occursDaily || false,
      preferMorning: newSubject.preferMorning || false,
      requiresDoublePeriod: newSubject.requiresDoublePeriod || false,
      minPeriodsPerDay: newSubject.minPeriodsPerDay,
      maxPeriodsPerDay: newSubject.maxPeriodsPerDay,
    };

    setConfig(prev => ({
      ...prev,
      subjects: [...(prev.subjects || []), subject],
    }));

    setNewSubject({
      name: '',
      periodsPerWeek: 5,
      category: 'subject',
      occursDaily: false,
      preferMorning: false,
      requiresDoublePeriod: false,
    });

    toast({
      title: 'Success',
      description: 'Subject added successfully',
    });
  };

  const handleAddClass = () => {
    if (!newClass.name) {
      toast({
        title: 'Validation Error',
        description: 'Please enter class name',
        variant: 'destructive',
      });
      return;
    }

    const classConfig: ClassConfig = {
      id: `class_${Date.now()}`,
      name: newClass.name!,
      teachingType: newClass.teachingType || 'subject_based',
      subjects: newClass.subjects || [],
      classTeacherId: newClass.classTeacherId,
      studentCount: newClass.studentCount,
    };

    setConfig(prev => ({
      ...prev,
      classes: [...(prev.classes || []), classConfig],
    }));

    setNewClass({
      name: '',
      teachingType: 'subject_based',
      subjects: [],
    });

    toast({
      title: 'Success',
      description: 'Class added successfully',
    });
  };

  const handleSaveConfiguration = async () => {
    try {
      setLoading(true);

      const fullConfig: TimetableConfiguration = {
        organizationId: user!.currentOrganizationId!,
        academicYear: new Date().getFullYear().toString(),
        term: config.term,
        workingDays: config.workingDays || [],
        periodsPerDay: config.periodsPerDay || 8,
        periodDuration: config.periodDuration || 45,
        schoolStartTime: config.schoolStartTime || '08:00',
        schoolEndTime: config.schoolEndTime || '15:00',
        breaks: config.breaks || [],
        teachers: config.teachers || [],
        totalTeachers: config.teachers?.length || 0,
        classes: config.classes || [],
        subjects: config.subjects || [],
        specialActivities: config.specialActivities,
        rooms: config.rooms,
        constraints: config.constraints || {
          avoidConsecutiveSameSubject: true,
          distributeSubjectsEvenly: true,
          maxConsecutivePeriods: 2,
          allowGaps: false,
          prioritizeTeacherPreferences: true,
        },
      };

      await saveTimetableConfiguration(fullConfig);

      toast({
        title: 'Success',
        description: 'Configuration saved successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save configuration',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateTimetable = async () => {
    // Validation
    if (!config.teachers || config.teachers.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please add at least one teacher',
        variant: 'destructive',
      });
      return;
    }

    if (!config.subjects || config.subjects.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please add at least one subject',
        variant: 'destructive',
      });
      return;
    }

    if (!config.classes || config.classes.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please add at least one class',
        variant: 'destructive',
      });
      return;
    }

    try {
      setGenerating(true);

      const fullConfig: TimetableConfiguration = {
        organizationId: user!.currentOrganizationId!,
        academicYear: new Date().getFullYear().toString(),
        term: config.term,
        workingDays: config.workingDays || [],
        periodsPerDay: config.periodsPerDay || 8,
        periodDuration: config.periodDuration || 45,
        schoolStartTime: config.schoolStartTime || '08:00',
        schoolEndTime: config.schoolEndTime || '15:00',
        breaks: config.breaks || [],
        teachers: config.teachers || [],
        totalTeachers: config.teachers?.length || 0,
        classes: config.classes || [],
        subjects: config.subjects || [],
        specialActivities: config.specialActivities,
        rooms: config.rooms,
        constraints: config.constraints || {
          avoidConsecutiveSameSubject: true,
          distributeSubjectsEvenly: true,
          maxConsecutivePeriods: 2,
          allowGaps: false,
          prioritizeTeacherPreferences: true,
        },
      };

      const result = await generateComprehensiveTimetable(fullConfig);

      if (result.success) {
        toast({
          title: 'Success!',
          description: `Generated ${result.entries.length} timetable entries successfully`,
        });

        // Show statistics
        setTimeout(() => {
          toast({
            title: 'Generation Statistics',
            description: `Allocated: ${result.statistics.totalPeriodsAllocated}/${result.statistics.totalPeriodsRequested} periods`,
          });
        }, 2000);

        // Redirect to timetable view
        setTimeout(() => {
          router.push('/timetables');
        }, 3000);
      } else {
        toast({
          title: 'Generation Completed with Issues',
          description: `${result.warnings.length} warnings, ${result.conflicts.length} conflicts`,
          variant: 'destructive',
        });
      }
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

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-8">
      {[
        { num: 1, label: 'School Setup' },
        { num: 2, label: 'Teachers' },
        { num: 3, label: 'Subjects' },
        { num: 4, label: 'Classes' },
        { num: 5, label: 'Review & Generate' },
      ].map((step, idx) => (
        <div key={step.num} className="flex items-center flex-1">
          <div className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                currentStep === step.num
                  ? 'bg-primary text-primary-foreground'
                  : currentStep > step.num
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {currentStep > step.num ? <Check className="h-5 w-5" /> : step.num}
            </div>
            <span className="text-xs mt-2 text-center">{step.label}</span>
          </div>
          {idx < 4 && (
            <div
              className={`flex-1 h-1 mx-2 ${
                currentStep > step.num ? 'bg-green-500' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Timetable Generation Wizard</h1>
        <p className="text-muted-foreground mt-2">
          Configure all parameters to generate a comprehensive timetable
        </p>
      </div>

      {renderStepIndicator()}

      {/* Step 1: School Setup */}
      {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              School Configuration
            </CardTitle>
            <CardDescription>
              Configure basic school timings and periods
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Periods Per Day</Label>
                <Input
                  type="number"
                  min="1"
                  max="12"
                  value={config.periodsPerDay}
                  onChange={(e) =>
                    setConfig({ ...config, periodsPerDay: parseInt(e.target.value) })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Period Duration (minutes)</Label>
                <Input
                  type="number"
                  min="30"
                  max="120"
                  value={config.periodDuration}
                  onChange={(e) =>
                    setConfig({ ...config, periodDuration: parseInt(e.target.value) })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>School Start Time</Label>
                <Input
                  type="time"
                  value={config.schoolStartTime}
                  onChange={(e) =>
                    setConfig({ ...config, schoolStartTime: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>School End Time</Label>
                <Input
                  type="time"
                  value={config.schoolEndTime}
                  onChange={(e) => setConfig({ ...config, schoolEndTime: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Working Days</Label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <div key={day} className="flex items-center space-x-2">
                    <Checkbox
                      id={day}
                      checked={config.workingDays?.includes(day)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setConfig({
                            ...config,
                            workingDays: [...(config.workingDays || []), day],
                          });
                        } else {
                          setConfig({
                            ...config,
                            workingDays: config.workingDays?.filter((d) => d !== day),
                          });
                        }
                      }}
                    />
                    <Label htmlFor={day} className="cursor-pointer">
                      {day}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <Label>Breaks Configuration</Label>
              {config.breaks?.map((breakItem, idx) => (
                <div key={idx} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label className="text-xs">Name</Label>
                    <Input
                      value={breakItem.name}
                      onChange={(e) => {
                        const newBreaks = [...(config.breaks || [])];
                        newBreaks[idx] = { ...breakItem, name: e.target.value };
                        setConfig({ ...config, breaks: newBreaks });
                      }}
                    />
                  </div>
                  <div className="w-32">
                    <Label className="text-xs">After Period</Label>
                    <Input
                      type="number"
                      value={breakItem.afterPeriod}
                      onChange={(e) => {
                        const newBreaks = [...(config.breaks || [])];
                        newBreaks[idx] = {
                          ...breakItem,
                          afterPeriod: parseInt(e.target.value),
                        };
                        setConfig({ ...config, breaks: newBreaks });
                      }}
                    />
                  </div>
                  <div className="w-32">
                    <Label className="text-xs">Duration (min)</Label>
                    <Input
                      type="number"
                      value={breakItem.duration}
                      onChange={(e) => {
                        const newBreaks = [...(config.breaks || [])];
                        newBreaks[idx] = {
                          ...breakItem,
                          duration: parseInt(e.target.value),
                        };
                        setConfig({ ...config, breaks: newBreaks });
                      }}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const newBreaks = config.breaks?.filter((_, i) => i !== idx);
                      setConfig({ ...config, breaks: newBreaks });
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setConfig({
                    ...config,
                    breaks: [
                      ...(config.breaks || []),
                      { name: 'New Break', afterPeriod: 1, duration: 15, type: 'break' },
                    ],
                  });
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Break
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Teachers */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Teachers Configuration
            </CardTitle>
            <CardDescription>
              Total Teachers: {config.teachers?.length || 0}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Add Teacher Form */}
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="font-semibold">Add New Teacher</h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Teacher Name *</Label>
                  <Input
                    placeholder="e.g., John Doe"
                    value={newTeacher.name}
                    onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Teacher Type</Label>
                  <Select
                    value={newTeacher.type}
                    onValueChange={(v) =>
                      setNewTeacher({ ...newTeacher, type: v as TeacherType })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="class_teacher">
                        Class Teacher (Handles all subjects for a class)
                      </SelectItem>
                      <SelectItem value="subject_teacher">
                        Subject Teacher (Teaches specific subjects)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Subjects (comma-separated)</Label>
                  <Input
                    placeholder="e.g., Mathematics, Science"
                    value={newTeacher.subjects?.join(', ')}
                    onChange={(e) =>
                      setNewTeacher({
                        ...newTeacher,
                        subjects: e.target.value.split(',').map((s) => s.trim()),
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Max Periods Per Day</Label>
                  <Input
                    type="number"
                    min="1"
                    max="12"
                    value={newTeacher.maxPeriodsPerDay}
                    onChange={(e) =>
                      setNewTeacher({
                        ...newTeacher,
                        maxPeriodsPerDay: parseInt(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Max Periods Per Week</Label>
                  <Input
                    type="number"
                    min="1"
                    max="40"
                    value={newTeacher.maxPeriodsPerWeek}
                    onChange={(e) =>
                      setNewTeacher({
                        ...newTeacher,
                        maxPeriodsPerWeek: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <Button onClick={handleAddTeacher}>
                <Plus className="h-4 w-4 mr-2" />
                Add Teacher
              </Button>
            </div>

            {/* Teachers List */}
            <div className="space-y-2">
              <h3 className="font-semibold">Added Teachers</h3>
              {config.teachers && config.teachers.length > 0 ? (
                <div className="space-y-2">
                  {config.teachers.map((teacher, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{teacher.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {teacher.type === 'class_teacher'
                            ? 'Class Teacher'
                            : 'Subject Teacher'}{' '}
                          | {teacher.subjects.join(', ')} | Max: {teacher.maxPeriodsPerDay}/
                          day, {teacher.maxPeriodsPerWeek}/week
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const newTeachers = config.teachers?.filter((_, i) => i !== idx);
                          setConfig({ ...config, teachers: newTeachers });
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No teachers added yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Subjects */}
      {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Subjects Configuration
            </CardTitle>
            <CardDescription>
              Total Subjects: {config.subjects?.length || 0}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Add Subject Form */}
            <div className="border rounded-lg p-4 space-y-4">
              <h3 className="font-semibold">Add New Subject</h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Subject Name *</Label>
                  <Input
                    placeholder="e.g., Mathematics"
                    value={newSubject.name}
                    onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Periods Per Week</Label>
                  <Input
                    type="number"
                    min="1"
                    max="20"
                    value={newSubject.periodsPerWeek}
                    onChange={(e) =>
                      setNewSubject({
                        ...newSubject,
                        periodsPerWeek: parseInt(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={newSubject.category}
                    onValueChange={(v) =>
                      setNewSubject({ ...newSubject, category: v as ActivityType })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTIVITY_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="occurs-daily"
                    checked={newSubject.occursDaily}
                    onCheckedChange={(checked) =>
                      setNewSubject({ ...newSubject, occursDaily: checked as boolean })
                    }
                  />
                  <Label htmlFor="occurs-daily" className="cursor-pointer">
                    Occurs Daily
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="prefer-morning"
                    checked={newSubject.preferMorning}
                    onCheckedChange={(checked) =>
                      setNewSubject({ ...newSubject, preferMorning: checked as boolean })
                    }
                  />
                  <Label htmlFor="prefer-morning" className="cursor-pointer">
                    Prefer Morning Slots
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="double-period"
                    checked={newSubject.requiresDoublePeriod}
                    onCheckedChange={(checked) =>
                      setNewSubject({
                        ...newSubject,
                        requiresDoublePeriod: checked as boolean,
                      })
                    }
                  />
                  <Label htmlFor="double-period" className="cursor-pointer">
                    Requires Double Period
                  </Label>
                </div>
              </div>

              <Button onClick={handleAddSubject}>
                <Plus className="h-4 w-4 mr-2" />
                Add Subject
              </Button>
            </div>

            {/* Subjects List */}
            <div className="space-y-2">
              <h3 className="font-semibold">Added Subjects</h3>
              {config.subjects && config.subjects.length > 0 ? (
                <div className="space-y-2">
                  {config.subjects.map((subject, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{subject.name}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline">{subject.periodsPerWeek} periods/week</Badge>
                          <Badge variant="outline">{subject.category}</Badge>
                          {subject.occursDaily && <Badge>Daily</Badge>}
                          {subject.preferMorning && <Badge>Morning</Badge>}
                          {subject.requiresDoublePeriod && <Badge>Double Period</Badge>}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const newSubjects = config.subjects?.filter((_, i) => i !== idx);
                          setConfig({ ...config, subjects: newSubjects });
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No subjects added yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Classes */}
      {currentStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Classes Configuration
            </CardTitle>
            <CardDescription>
              Total Classes: {config.classes?.length || 0}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Classes List */}
            <div className="space-y-2">
              {config.classes && config.classes.length > 0 ? (
                <div className="space-y-2">
                  {config.classes.map((cls, idx) => (
                    <div key={idx} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{cls.name}</p>
                        <Badge>
                          {cls.teachingType === 'class_teacher'
                            ? 'Class Teacher Model'
                            : 'Subject-Based Teaching'}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm">Teaching Type</Label>
                        <Select
                          value={cls.teachingType}
                          onValueChange={(v) => {
                            const newClasses = [...(config.classes || [])];
                            newClasses[idx] = {
                              ...cls,
                              teachingType: v as 'class_teacher' | 'subject_based',
                            };
                            setConfig({ ...config, classes: newClasses });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="class_teacher">
                              Class Teacher (One teacher for all subjects)
                            </SelectItem>
                            <SelectItem value="subject_based">
                              Subject-Based (Different teachers for different subjects)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {cls.teachingType === 'class_teacher' && (
                        <div className="space-y-2">
                          <Label className="text-sm">Class Teacher</Label>
                          <Select
                            value={cls.classTeacherId}
                            onValueChange={(v) => {
                              const newClasses = [...(config.classes || [])];
                              newClasses[idx] = { ...cls, classTeacherId: v };
                              setConfig({ ...config, classes: newClasses });
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select teacher" />
                            </SelectTrigger>
                            <SelectContent>
                              {config.teachers
                                ?.filter((t) => t.type === 'class_teacher')
                                .map((teacher) => (
                                  <SelectItem key={teacher.id} value={teacher.id}>
                                    {teacher.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label className="text-sm">Subjects for this class</Label>
                        <div className="flex flex-wrap gap-2">
                          {config.subjects?.map((subject) => (
                            <div key={subject.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`${cls.id}_${subject.id}`}
                                checked={cls.subjects.includes(subject.id)}
                                onCheckedChange={(checked) => {
                                  const newClasses = [...(config.classes || [])];
                                  if (checked) {
                                    newClasses[idx] = {
                                      ...cls,
                                      subjects: [...cls.subjects, subject.id],
                                    };
                                  } else {
                                    newClasses[idx] = {
                                      ...cls,
                                      subjects: cls.subjects.filter((s) => s !== subject.id),
                                    };
                                  }
                                  setConfig({ ...config, classes: newClasses });
                                }}
                              />
                              <Label
                                htmlFor={`${cls.id}_${subject.id}`}
                                className="cursor-pointer text-sm"
                              >
                                {subject.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No classes found. Please add classes in your school settings first.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Review & Generate */}
      {currentStep === 5 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check className="h-5 w-5" />
              Review & Generate Timetable
            </CardTitle>
            <CardDescription>
              Review your configuration and generate the timetable
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h3 className="font-semibold">School Configuration</h3>
                <div className="text-sm space-y-1">
                  <p>Periods per day: {config.periodsPerDay}</p>
                  <p>Period duration: {config.periodDuration} minutes</p>
                  <p>Working days: {config.workingDays?.join(', ')}</p>
                  <p>Breaks: {config.breaks?.length || 0} configured</p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Teachers</h3>
                <div className="text-sm space-y-1">
                  <p>Total: {config.teachers?.length || 0}</p>
                  <p>
                    Class Teachers:{' '}
                    {config.teachers?.filter((t) => t.type === 'class_teacher').length || 0}
                  </p>
                  <p>
                    Subject Teachers:{' '}
                    {config.teachers?.filter((t) => t.type === 'subject_teacher').length || 0}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Subjects</h3>
                <div className="text-sm space-y-1">
                  <p>Total: {config.subjects?.length || 0}</p>
                  <p>
                    Daily subjects:{' '}
                    {config.subjects?.filter((s) => s.occursDaily).length || 0}
                  </p>
                  <p>
                    Total periods needed per week:{' '}
                    {config.subjects?.reduce((sum, s) => sum + s.periodsPerWeek, 0) || 0}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Classes</h3>
                <div className="text-sm space-y-1">
                  <p>Total: {config.classes?.length || 0}</p>
                  <p>
                    Class teacher model:{' '}
                    {config.classes?.filter((c) => c.teachingType === 'class_teacher').length ||
                      0}
                  </p>
                  <p>
                    Subject-based:{' '}
                    {config.classes?.filter((c) => c.teachingType === 'subject_based').length ||
                      0}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Constraints & Preferences</h3>
              <div className="text-sm space-y-1">
                <p>
                  ✓ Avoid consecutive same subject:{' '}
                  {config.constraints?.avoidConsecutiveSameSubject ? 'Yes' : 'No'}
                </p>
                <p>
                  ✓ Distribute subjects evenly:{' '}
                  {config.constraints?.distributeSubjectsEvenly ? 'Yes' : 'No'}
                </p>
                <p>✓ Max consecutive periods: {config.constraints?.maxConsecutivePeriods || 2}</p>
                <p>✓ Allow gaps: {config.constraints?.allowGaps ? 'Yes' : 'No'}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSaveConfiguration} variant="outline" disabled={loading}>
                {loading ? 'Saving...' : 'Save Configuration'}
              </Button>
              <Button onClick={handleGenerateTimetable} disabled={generating}>
                {generating ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generate Timetable
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <Button
          onClick={() => setCurrentStep(Math.min(5, currentStep + 1))}
          disabled={currentStep === 5}
        >
          Next
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
