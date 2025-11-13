'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  ArrowRight,
  Users,
  BookOpen,
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Loader2,
  GraduationCap,
  ClipboardList,
} from 'lucide-react';
import {
  executeAcademicYearTransition,
  previewAcademicYearTransition,
  type TransitionOptions,
  type StudentPromotionRule,
} from '@/services/academic-year-transition';
import { getSchoolAcademicYears } from '@/services/academic-year';
import { AcademicYear } from '@/schemas/organization';

interface AcademicYearTransitionWizardProps {
  isOpen: boolean;
  onClose: () => void;
  currentYear: AcademicYear;
  newYear: AcademicYear;
  onComplete?: () => void;
}

export function AcademicYearTransitionWizard({
  isOpen,
  onClose,
  currentYear,
  newYear,
  onComplete,
}: AcademicYearTransitionWizardProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Transition options
  const [rolloverClasses, setRolloverClasses] = useState(true);
  const [promoteStudents, setPromoteStudents] = useState(true);
  const [rolloverFeeStructure, setRolloverFeeStructure] = useState(true);
  const [rolloverStaffAssignments, setRolloverStaffAssignments] = useState(true);
  const [copyTimetableTemplates, setCopyTimetableTemplates] = useState(true);

  // Preview data
  const [preview, setPreview] = useState<{
    currentYear: string;
    classes: number;
    students: number;
    feeTypes: number;
    staffAssignments: number;
    timetables: number;
  } | null>(null);

  // Result
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (isOpen && user?.currentOrganizationId) {
      loadPreview();
    }
  }, [isOpen, user?.currentOrganizationId]);

  const loadPreview = async () => {
    if (!user?.currentOrganizationId) return;

    setLoading(true);
    try {
      const previewData = await previewAcademicYearTransition(user.currentOrganizationId);
      setPreview(previewData);
    } catch (error) {
      console.error('Error loading preview:', error);
      toast({
        title: 'Error',
        description: 'Failed to load transition preview',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteTransition = async () => {
    if (!user?.currentOrganizationId) return;

    setProcessing(true);
    try {
      const options: TransitionOptions = {
        organizationId: user.currentOrganizationId,
        currentYearId: currentYear.id,
        newYearId: newYear.id,
        newYearName: newYear.name,
        rolloverClasses,
        promoteStudents,
        rolloverFeeStructure,
        rolloverStaffAssignments,
        copyTimetableTemplates,
      };

      const transitionResult = await executeAcademicYearTransition(options);
      setResult(transitionResult);

      if (transitionResult.success) {
        setStep(4);
        toast({
          title: 'Success',
          description: transitionResult.message,
        });
        
        if (onComplete) {
          onComplete();
        }
      } else {
        toast({
          title: 'Error',
          description: transitionResult.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error executing transition:', error);
      toast({
        title: 'Error',
        description: 'Failed to execute academic year transition',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Calendar className="h-16 w-16 mx-auto text-primary mb-4" />
        <h3 className="text-2xl font-bold mb-2">Academic Year Transition</h3>
        <p className="text-muted-foreground">
          Transition from <Badge variant="outline">{currentYear.name}</Badge> to{' '}
          <Badge variant="outline">{newYear.name}</Badge>
        </p>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          This wizard will help you transition all your school data to the new academic year.
          Your current year data will remain intact for historical records.
        </AlertDescription>
      </Alert>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : preview && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <BookOpen className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                <div className="text-2xl font-bold">{preview.classes}</div>
                <div className="text-sm text-muted-foreground">Classes</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Users className="h-8 w-8 mx-auto text-green-600 mb-2" />
                <div className="text-2xl font-bold">{preview.students}</div>
                <div className="text-sm text-muted-foreground">Students</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <DollarSign className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                <div className="text-2xl font-bold">{preview.feeTypes}</div>
                <div className="text-sm text-muted-foreground">Fee Types</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <GraduationCap className="h-8 w-8 mx-auto text-orange-600 mb-2" />
                <div className="text-2xl font-bold">{preview.staffAssignments}</div>
                <div className="text-sm text-muted-foreground">Staff</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <ClipboardList className="h-8 w-8 mx-auto text-pink-600 mb-2" />
                <div className="text-2xl font-bold">{preview.timetables}</div>
                <div className="text-sm text-muted-foreground">Timetables</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold mb-4">Select What to Transition</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Choose which data to rollover to the new academic year
        </p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="rollover-classes"
                checked={rolloverClasses}
                onCheckedChange={(checked) => setRolloverClasses(checked as boolean)}
              />
              <div className="space-y-1 flex-1">
                <Label htmlFor="rollover-classes" className="text-base font-semibold cursor-pointer">
                  Rollover Classes
                </Label>
                <p className="text-sm text-muted-foreground">
                  Create copies of all classes for the new year with reset enrollment counts
                </p>
              </div>
              <BookOpen className="h-5 w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="promote-students"
                checked={promoteStudents}
                onCheckedChange={(checked) => setPromoteStudents(checked as boolean)}
              />
              <div className="space-y-1 flex-1">
                <Label htmlFor="promote-students" className="text-base font-semibold cursor-pointer">
                  Promote Students
                </Label>
                <p className="text-sm text-muted-foreground">
                  Automatically promote students to their next class
                </p>
              </div>
              <Users className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="rollover-fees"
                checked={rolloverFeeStructure}
                onCheckedChange={(checked) => setRolloverFeeStructure(checked as boolean)}
              />
              <div className="space-y-1 flex-1">
                <Label htmlFor="rollover-fees" className="text-base font-semibold cursor-pointer">
                  Rollover Fee Structure
                </Label>
                <p className="text-sm text-muted-foreground">
                  Copy fee types to new year (amounts can be adjusted later)
                </p>
                <Alert className="mt-2">
                  <AlertDescription className="text-xs">
                    ⚠️ Actual fee records stay with their original year for accurate financial tracking
                  </AlertDescription>
                </Alert>
              </div>
              <DollarSign className="h-5 w-5 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="rollover-staff"
                checked={rolloverStaffAssignments}
                onCheckedChange={(checked) => setRolloverStaffAssignments(checked as boolean)}
              />
              <div className="space-y-1 flex-1">
                <Label htmlFor="rollover-staff" className="text-base font-semibold cursor-pointer">
                  Rollover Staff Assignments
                </Label>
                <p className="text-sm text-muted-foreground">
                  Copy teacher and subject assignments to new year
                </p>
              </div>
              <GraduationCap className="h-5 w-5 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="copy-timetables"
                checked={copyTimetableTemplates}
                onCheckedChange={(checked) => setCopyTimetableTemplates(checked as boolean)}
              />
              <div className="space-y-1 flex-1">
                <Label htmlFor="copy-timetables" className="text-base font-semibold cursor-pointer">
                  Copy Timetable Templates
                </Label>
                <p className="text-sm text-muted-foreground">
                  Copy timetables as drafts for the new year
                </p>
              </div>
              <ClipboardList className="h-5 w-5 text-pink-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <AlertTriangle className="h-16 w-16 mx-auto text-amber-500 mb-4" />
        <h3 className="text-2xl font-bold mb-2">Confirm Transition</h3>
        <p className="text-muted-foreground">
          Review your selections and confirm to proceed
        </p>
      </div>

      <Alert>
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-semibold">This action will:</p>
            <ul className="list-disc list-inside space-y-1 text-sm ml-2">
              {rolloverClasses && <li>Create {preview?.classes} classes for {newYear.name}</li>}
              {promoteStudents && <li>Promote {preview?.students} students to next class</li>}
              {rolloverFeeStructure && <li>Copy {preview?.feeTypes} fee types (structure only)</li>}
              {rolloverStaffAssignments && <li>Copy {preview?.staffAssignments} staff assignments</li>}
              {copyTimetableTemplates && <li>Copy {preview?.timetables} timetables as drafts</li>}
            </ul>
          </div>
        </AlertDescription>
      </Alert>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <p className="font-semibold mb-2">Important Notes:</p>
          <ul className="list-disc list-inside space-y-1 text-sm ml-2">
            <li>All financial records remain attached to their original academic year</li>
            <li>You can adjust fee amounts and due dates after transition</li>
            <li>Student promotion can be manually adjusted later if needed</li>
            <li>Your current year data will remain unchanged</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle className="h-16 w-16 mx-auto text-green-600 mb-4" />
        <h3 className="text-2xl font-bold mb-2">Transition Complete!</h3>
        <p className="text-muted-foreground">
          Successfully transitioned to {newYear.name}
        </p>
      </div>

      {result && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Classes Rolled Over:</span>
                  <Badge>{result.stats.classesRolledOver}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Students Promoted:</span>
                  <Badge>{result.stats.studentsPromoted}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Fee Types Rolled Over:</span>
                  <Badge>{result.stats.feeTypesRolledOver}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Staff Assignments Rolled Over:</span>
                  <Badge>{result.stats.staffAssignmentsRolledOver}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Timetables Copied:</span>
                  <Badge>{result.stats.timetablesCopied}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {result.warnings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-amber-600">Action Items</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {result.warnings.map((warning: string, index: number) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Academic Year Transition Wizard</DialogTitle>
          <DialogDescription>
            Step {step} of 4: {
              step === 1 ? 'Overview' :
              step === 2 ? 'Select Options' :
              step === 3 ? 'Confirmation' :
              'Complete'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </div>

        <DialogFooter>
          {step < 4 && (
            <>
              {step > 1 && (
                <Button
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  disabled={processing}
                >
                  Back
                </Button>
              )}
              
              {step < 3 && (
                <Button onClick={() => setStep(step + 1)} disabled={loading}>
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
              
              {step === 3 && (
                <Button
                  onClick={handleExecuteTransition}
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Execute Transition'
                  )}
                </Button>
              )}
            </>
          )}
          
          {step === 4 && (
            <Button onClick={onClose}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
