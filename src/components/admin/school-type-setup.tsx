'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  School,
  GraduationCap,
  BookOpen,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import {
  setupSchoolTypesAndSeed,
  getOrganizationSchoolTypes,
  checkExistingClasses,
  checkExistingSubjects,
} from '@/services/school-type';
import { SCHOOL_TYPE_CONFIGS, type SchoolType, getSchoolTypeOptions } from '@/lib/school-types';

interface SchoolTypeSetupProps {
  onComplete?: () => void;
  showAsDialog?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export function SchoolTypeSetup({ 
  onComplete, 
  showAsDialog = false,
  isOpen = false,
  onClose,
}: SchoolTypeSetupProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [selectedTypes, setSelectedTypes] = useState<SchoolType[]>([]);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [existingData, setExistingData] = useState({
    hasClasses: false,
    classCount: 0,
    hasSubjects: false,
    subjectCount: 0,
  });
  const [currentSchoolTypes, setCurrentSchoolTypes] = useState<SchoolType[]>([]);
  const [seedClasses, setSeedClasses] = useState(true);
  const [seedSubjects, setSeedSubjects] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const schoolTypeOptions = getSchoolTypeOptions();

  useEffect(() => {
    if (user?.currentOrganizationId) {
      checkExistingData();
      loadCurrentSchoolTypes();
    }
  }, [user?.currentOrganizationId]);

  const checkExistingData = async () => {
    try {
      setChecking(true);
      const [classesResult, subjectsResult] = await Promise.all([
        checkExistingClasses(user!.currentOrganizationId!),
        checkExistingSubjects(user!.currentOrganizationId!),
      ]);

      setExistingData({
        hasClasses: classesResult.hasClasses,
        classCount: classesResult.count,
        hasSubjects: subjectsResult.hasSubjects,
        subjectCount: subjectsResult.count,
      });

      // If data exists, default to not seeding
      if (classesResult.hasClasses) {
        setSeedClasses(false);
      }
      if (subjectsResult.hasSubjects) {
        setSeedSubjects(false);
      }
    } catch (error) {
      console.error('Error checking existing data:', error);
    } finally {
      setChecking(false);
    }
  };

  const loadCurrentSchoolTypes = async () => {
    try {
      const types = await getOrganizationSchoolTypes(user!.currentOrganizationId!);
      setCurrentSchoolTypes(types);
      setSelectedTypes(types);
    } catch (error) {
      console.error('Error loading school types:', error);
    }
  };

  const handleTypeToggle = (type: SchoolType) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleSetup = async () => {
    if (selectedTypes.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please select at least one school type',
        variant: 'destructive',
      });
      return;
    }

    // If existing data and trying to seed, show confirmation
    if ((existingData.hasClasses && seedClasses) || (existingData.hasSubjects && seedSubjects)) {
      setShowConfirmation(true);
      return;
    }

    await performSetup();
  };

  const performSetup = async () => {
    try {
      setLoading(true);
      setShowConfirmation(false);

      const result = await setupSchoolTypesAndSeed(
        user!.currentOrganizationId!,
        selectedTypes,
        seedClasses,
        seedSubjects
      );

      toast({
        title: 'Success!',
        description: result.message,
      });

      // Show details
      setTimeout(() => {
        if (result.classesCreated > 0) {
          toast({
            title: 'Classes Created',
            description: `${result.classesCreated} classes have been added to your school`,
          });
        }
        if (result.subjectsCreated > 0) {
          toast({
            title: 'Subjects Created',
            description: `${result.subjectsCreated} subjects have been added to your curriculum`,
          });
        }
      }, 1500);

      if (onComplete) {
        setTimeout(() => onComplete(), 2500);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to setup school types',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getTotalClasses = () => {
    return selectedTypes.reduce((total, type) => {
      return total + SCHOOL_TYPE_CONFIGS[type].classes.length;
    }, 0);
  };

  const getTotalSubjects = () => {
    const subjectsSet = new Set<string>();
    selectedTypes.forEach(type => {
      SCHOOL_TYPE_CONFIGS[type].subjects.forEach(subject => {
        subjectsSet.add(subject.code);
      });
    });
    return subjectsSet.size;
  };

  const content = (
    <div className="space-y-6">
      {checking ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Existing Data Warning */}
          {(existingData.hasClasses || existingData.hasSubjects) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-yellow-800">Existing Data Detected</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    {existingData.hasClasses && `You have ${existingData.classCount} existing classes. `}
                    {existingData.hasSubjects && `You have ${existingData.subjectCount} existing subjects. `}
                    Auto-seeding will add more items.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Current School Types */}
          {currentSchoolTypes.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-800">Current Configuration</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Your school is currently configured as:{' '}
                    {currentSchoolTypes.map(type => SCHOOL_TYPE_CONFIGS[type].name).join(', ')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* School Type Selection */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Select School Types</h3>
              <p className="text-sm text-muted-foreground">
                Choose one or more school types that apply to your institution
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {schoolTypeOptions.map((option) => {
                const isSelected = selectedTypes.includes(option.value);
                const config = SCHOOL_TYPE_CONFIGS[option.value];

                return (
                  <Card
                    key={option.value}
                    className={`cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-md'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => handleTypeToggle(option.value)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleTypeToggle(option.value)}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-2">
                          <div>
                            <h4 className="font-semibold">{option.label}</h4>
                            <p className="text-xs text-muted-foreground">
                              {option.description}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="text-xs">
                              <BookOpen className="h-3 w-3 mr-1" />
                              {option.classCount} Classes
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              <GraduationCap className="h-3 w-3 mr-1" />
                              {option.subjectCount} Subjects
                            </Badge>
                          </div>

                          {isSelected && (
                            <details className="text-xs">
                              <summary className="cursor-pointer text-primary hover:underline">
                                View classes
                              </summary>
                              <div className="mt-2 pl-2 space-y-1">
                                {config.classes.map((cls) => (
                                  <div key={cls.name} className="text-muted-foreground">
                                    • {cls.displayName}
                                    {cls.ageRange && (
                                      <span className="text-xs ml-2">({cls.ageRange})</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </details>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Summary */}
          {selectedTypes.length > 0 && (
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Auto-Seed Configuration
                </CardTitle>
                <CardDescription>
                  Automatically create classes and subjects based on your selection
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="seed-classes"
                      checked={seedClasses}
                      onCheckedChange={(checked) => setSeedClasses(checked as boolean)}
                    />
                    <Label htmlFor="seed-classes" className="cursor-pointer">
                      Auto-create <strong>{getTotalClasses()} classes</strong>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="seed-subjects"
                      checked={seedSubjects}
                      onCheckedChange={(checked) => setSeedSubjects(checked as boolean)}
                    />
                    <Label htmlFor="seed-subjects" className="cursor-pointer">
                      Auto-create <strong>{getTotalSubjects()} subjects</strong>
                    </Label>
                  </div>
                </div>

                {(seedClasses || seedSubjects) && (
                  <div className="text-sm text-muted-foreground bg-white/50 rounded p-3">
                    <p className="font-medium mb-2">What will be created:</p>
                    <ul className="space-y-1 ml-4 list-disc">
                      {seedClasses && (
                        <li>
                          {getTotalClasses()} classes from:{' '}
                          {selectedTypes.map(t => SCHOOL_TYPE_CONFIGS[t].name).join(', ')}
                        </li>
                      )}
                      {seedSubjects && (
                        <li>
                          {getTotalSubjects()} subjects including core, elective, and activity
                          subjects
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Auto-Seed</DialogTitle>
            <DialogDescription>
              You already have existing data. Auto-seeding will add more items to your school.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {existingData.hasClasses && seedClasses && (
              <p className="text-sm">
                • You have {existingData.classCount} existing classes. {getTotalClasses()} new
                classes will be added.
              </p>
            )}
            {existingData.hasSubjects && seedSubjects && (
              <p className="text-sm">
                • You have {existingData.subjectCount} existing subjects. {getTotalSubjects()}{' '}
                new subjects will be added.
              </p>
            )}
            <p className="text-sm font-medium text-yellow-700">
              This action cannot be undone. Continue?
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmation(false)}>
              Cancel
            </Button>
            <Button onClick={performSetup} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Setting up...
                </>
              ) : (
                'Continue'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  if (showAsDialog) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <School className="h-5 w-5" />
              School Type Configuration
            </DialogTitle>
            <DialogDescription>
              Configure your school types and auto-seed classes and subjects
            </DialogDescription>
          </DialogHeader>
          {content}
          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSetup} disabled={loading || selectedTypes.length === 0}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Save Configuration
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <School className="h-5 w-5" />
          School Type Configuration
        </CardTitle>
        <CardDescription>
          Configure your school types and auto-seed classes and subjects
        </CardDescription>
      </CardHeader>
      <CardContent>
        {content}
        <div className="flex justify-end gap-2 mt-6">
          <Button onClick={handleSetup} disabled={loading || selectedTypes.length === 0}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Setting up...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Save Configuration
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
