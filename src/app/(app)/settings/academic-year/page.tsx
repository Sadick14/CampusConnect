'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/common/page-header';
import { AcademicYearSkeleton } from '@/components/common/page-skeletons';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Calendar,
  Plus,
  Edit,
  Archive,
  CheckCircle,
  Clock,
  Loader2,
  PlayCircle,
  StopCircle,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import {
  getSchoolAcademicYears,
  getCurrentAcademicYear,
  createAcademicYear,
  updateAcademicYear,
  setCurrentTerm,
  endAcademicYear,
  addTermToAcademicYear,
  updateTerm,
} from '@/services/academic-year';
import { archiveAcademicYear } from '@/services/archive';
import { AcademicYear, AcademicTerm } from '@/schemas/organization';
import { Timestamp } from 'firebase/firestore';
import { AcademicYearTransitionWizard } from '@/components/admin/academic-year-transition-wizard';

export default function AcademicYearSettingsPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [currentYear, setCurrentYear] = useState<AcademicYear | null>(null);
  
  // Dialogs
  const [createYearDialog, setCreateYearDialog] = useState(false);
  const [editYearDialog, setEditYearDialog] = useState(false);
  const [addTermDialog, setAddTermDialog] = useState(false);
  const [endYearDialog, setEndYearDialog] = useState(false);
  const [transitionDialog, setTransitionDialog] = useState(false);
  const [selectedYear, setSelectedYear] = useState<AcademicYear | null>(null);
  const [nextYear, setNextYear] = useState<AcademicYear | null>(null);
  
  // Form states
  const [yearName, setYearName] = useState('');
  const [yearStart, setYearStart] = useState('');
  const [yearEnd, setYearEnd] = useState('');
  const [termName, setTermName] = useState('');
  const [termNumber, setTermNumber] = useState(1);
  const [termStart, setTermStart] = useState('');
  const [termEnd, setTermEnd] = useState('');
  
  // End year options
  const [promoteStudents, setPromoteStudents] = useState(true);
  const [carryOverFees, setCarryOverFees] = useState(true);
  const [archiveData, setArchiveData] = useState(true);
  const [nextYearId, setNextYearId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadAcademicYears();
  }, [currentUser]);

  async function loadAcademicYears() {
    if (!currentUser?.currentOrganizationId) return;
    
    setLoading(true);
    try {
      const [years, current] = await Promise.all([
        getSchoolAcademicYears(currentUser.currentOrganizationId),
        getCurrentAcademicYear(currentUser.currentOrganizationId),
      ]);
      
      setAcademicYears(years);
      setCurrentYear(current);
    } catch (error) {
      console.error('Error loading academic years:', error);
      toast({
        title: 'Error',
        description: 'Failed to load academic years',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateYear() {
    if (!currentUser?.currentOrganizationId || !yearName || !yearStart || !yearEnd) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createAcademicYear({
        organizationId: currentUser.currentOrganizationId,
        name: yearName,
        startDate: Timestamp.fromDate(new Date(yearStart)),
        endDate: Timestamp.fromDate(new Date(yearEnd)),
        isCurrent: academicYears.length === 0, // First year is current
        isActive: true,
        terms: [],
      });

      toast({
        title: 'Success',
        description: 'Academic year created successfully',
      });

      setCreateYearDialog(false);
      resetYearForm();
      loadAcademicYears();
    } catch (error) {
      console.error('Error creating academic year:', error);
      toast({
        title: 'Error',
        description: 'Failed to create academic year',
        variant: 'destructive',
      });
    }
  }

  async function handleSetCurrentYear(yearId: string) {
    try {
      await updateAcademicYear(yearId, { isCurrent: true, isActive: true });
      
      toast({
        title: 'Success',
        description: 'Current academic year updated',
      });
      
      loadAcademicYears();
    } catch (error) {
      console.error('Error setting current year:', error);
      toast({
        title: 'Error',
        description: 'Failed to update current year',
        variant: 'destructive',
      });
    }
  }

  async function handleAddTerm() {
    if (!selectedYear || !termName || !termStart || !termEnd) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      await addTermToAcademicYear(selectedYear.id, {
        termNumber,
        name: termName,
        startDate: Timestamp.fromDate(new Date(termStart)),
        endDate: Timestamp.fromDate(new Date(termEnd)),
        isCurrent: selectedYear.terms.length === 0,
      });

      toast({
        title: 'Success',
        description: 'Term added successfully',
      });

      setAddTermDialog(false);
      resetTermForm();
      loadAcademicYears();
    } catch (error) {
      console.error('Error adding term:', error);
      toast({
        title: 'Error',
        description: 'Failed to add term',
        variant: 'destructive',
      });
    }
  }

  async function handleSetCurrentTerm(yearId: string, termNum: number) {
    try {
      await setCurrentTerm(yearId, termNum);
      
      toast({
        title: 'Success',
        description: 'Current term updated',
      });
      
      loadAcademicYears();
    } catch (error) {
      console.error('Error setting current term:', error);
      toast({
        title: 'Error',
        description: 'Failed to update current term',
        variant: 'destructive',
      });
    }
  }

  async function handleEndYear() {
    if (!selectedYear || !currentUser) return;

    setProcessing(true);

    try {
      // Find next academic year for fee carryover
      let nextYear = null;
      if (carryOverFees) {
        nextYear = academicYears.find(y => 
          y.id !== selectedYear.id && 
          y.startDate.toDate().getTime() > selectedYear.endDate.toDate().getTime()
        );
        
        if (!nextYear) {
          toast({
            title: 'Warning',
            description: 'No future academic year found for fee carryover. Please create the next year first.',
            variant: 'destructive',
          });
          setProcessing(false);
          return;
        }
      }

      // Archive data first if requested
      if (archiveData) {
        await archiveAcademicYear(
          currentUser.currentOrganizationId!,
          selectedYear.id,
          selectedYear.name,
          currentUser.id
        );
        console.log('✅ Data archived successfully');
      }

      // End the academic year with all options
      const endResult = await endAcademicYear(selectedYear.id, {
        promoteStudents,
        carryOverFees: carryOverFees && nextYear !== null,
        archiveData,
        newAcademicYearId: nextYear?.id,
        newAcademicYearName: nextYear?.name,
      });

      // Build success message
      let successMessage = `Academic year ${selectedYear.name} ended successfully`;
      const details = [];
      
      if (endResult.promotionResult) {
        details.push(`${endResult.promotionResult.promoted} students promoted`);
        details.push(`${endResult.promotionResult.graduated} students graduated`);
      }
      
      if (endResult.carryoverResult) {
        details.push(`${endResult.carryoverResult.feesCarriedOver} fee records carried over`);
      }
      
      if (archiveData) {
        details.push('data archived');
      }

      if (details.length > 0) {
        successMessage += ': ' + details.join(', ');
      }

      toast({
        title: 'Success',
        description: successMessage,
      });

      setEndYearDialog(false);
      setSelectedYear(null);
      setProcessing(false);
      loadAcademicYears();
    } catch (error: any) {
      console.error('Error ending year:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to end academic year',
        variant: 'destructive',
      });
      setProcessing(false);
    }
  }

  function resetYearForm() {
    setYearName('');
    setYearStart('');
    setYearEnd('');
  }

  function resetTermForm() {
    setTermName('');
    setTermNumber(1);
    setTermStart('');
    setTermEnd('');
  }

  function formatDate(timestamp: any): string {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  }

  if (loading) {
    return <AcademicYearSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Academic Year & Terms"
        description="Manage academic years, terms, and archive historical data"
      />

      {/* Current Academic Year */}
      {currentYear && (
        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Current Academic Year
                </CardTitle>
                <CardDescription className="mt-2">
                  {currentYear.name}
                </CardDescription>
              </div>
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Start Date:</span>
                <p className="font-medium">{formatDate(currentYear.startDate)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">End Date:</span>
                <p className="font-medium">{formatDate(currentYear.endDate)}</p>
              </div>
            </div>

            {/* Terms */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">Terms</h4>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedYear(currentYear);
                    setTermNumber((currentYear.terms?.length || 0) + 1);
                    setAddTermDialog(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Term
                </Button>
              </div>

              <div className="space-y-2">
                {currentYear.terms?.length > 0 ? (
                  currentYear.terms.map((term) => (
                    <div
                      key={term.termNumber}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h5 className="font-medium">{term.name}</h5>
                          {term.isCurrent && (
                            <Badge className="bg-blue-100 text-blue-800">Current</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(term.startDate)} - {formatDate(term.endDate)}
                        </p>
                      </div>
                      {!term.isCurrent && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSetCurrentTerm(currentYear.id, term.termNumber)}
                        >
                          <PlayCircle className="h-4 w-4 mr-1" />
                          Set Current
                        </Button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No terms added yet. Click "Add Term" to create your first term.
                  </p>
                )}
              </div>
            </div>

            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription className="text-sm text-blue-800">
                <p className="font-semibold mb-2">📋 About Year Transition</p>
                <p className="mb-2">
                  The transition wizard helps you move to a new academic year by duplicating:
                </p>
                <ul className="list-disc list-inside space-y-1 text-xs ml-2">
                  <li>Classes (with reset enrollment)</li>
                  <li>Student records (with promotion to next grade)</li>
                  <li>Fee types (structure only - not actual payments)</li>
                  <li>Staff assignments</li>
                  <li>Timetable templates</li>
                </ul>
                <p className="mt-2 text-xs font-semibold">
                  ⚠️ Financial records (payments, invoices) remain with their original year for accurate accounting.
                </p>
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  // Find the next academic year (if created)
                  const futureYears = academicYears.filter(y => 
                    new Date(y.startDate.toDate()).getTime() > new Date(currentYear.endDate.toDate()).getTime()
                  );
                  
                  if (futureYears.length > 0) {
                    setNextYear(futureYears[0]);
                    setTransitionDialog(true);
                  } else {
                    toast({
                      title: 'No Next Year Found',
                      description: 'Please create the next academic year first before transitioning.',
                      variant: 'destructive',
                    });
                  }
                }}
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Transition to New Year
              </Button>

              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => {
                  setSelectedYear(currentYear);
                  setEndYearDialog(true);
                }}
              >
                <StopCircle className="h-4 w-4 mr-2" />
                End Academic Year
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Academic Years */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Academic Years</CardTitle>
            <Button onClick={() => setCreateYearDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Academic Year
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {academicYears.length > 0 ? (
              academicYears.map((year) => (
                <div
                  key={year.id}
                  className={`p-4 border rounded-lg ${
                    year.isCurrent ? 'border-primary bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{year.name}</h4>
                        {year.isCurrent && (
                          <Badge className="bg-green-100 text-green-800">Current</Badge>
                        )}
                        {!year.isActive && (
                          <Badge className="bg-gray-100 text-gray-800">
                            <Archive className="h-3 w-3 mr-1" />
                            Archived
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(year.startDate)} - {formatDate(year.endDate)}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {year.terms?.length || 0} term(s)
                      </p>
                    </div>
                    {!year.isCurrent && year.isActive && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSetCurrentYear(year.id)}
                      >
                        Set as Current
                      </Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No academic years found. Create your first academic year to get started.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Academic Year Dialog */}
      <Dialog open={createYearDialog} onOpenChange={setCreateYearDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Academic Year</DialogTitle>
            <DialogDescription>
              Set up a new academic year for your school
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Academic Year Name *</Label>
              <Input
                placeholder="e.g., 2024/2025"
                value={yearName}
                onChange={(e) => setYearName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date *</Label>
                <Input
                  type="date"
                  value={yearStart}
                  onChange={(e) => setYearStart(e.target.value)}
                />
              </div>
              <div>
                <Label>End Date *</Label>
                <Input
                  type="date"
                  value={yearEnd}
                  onChange={(e) => setYearEnd(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateYearDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateYear}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Term Dialog */}
      <Dialog open={addTermDialog} onOpenChange={setAddTermDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Term</DialogTitle>
            <DialogDescription>
              Add a new term to {selectedYear?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Term Number *</Label>
                <Input
                  type="number"
                  min="1"
                  value={termNumber}
                  onChange={(e) => setTermNumber(parseInt(e.target.value))}
                />
              </div>
              <div>
                <Label>Term Name *</Label>
                <Input
                  placeholder="e.g., First Term"
                  value={termName}
                  onChange={(e) => setTermName(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Date *</Label>
                <Input
                  type="date"
                  value={termStart}
                  onChange={(e) => setTermStart(e.target.value)}
                />
              </div>
              <div>
                <Label>End Date *</Label>
                <Input
                  type="date"
                  value={termEnd}
                  onChange={(e) => setTermEnd(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddTermDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddTerm}>Add Term</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* End Academic Year Dialog */}
      <AlertDialog open={endYearDialog} onOpenChange={setEndYearDialog}>
        <AlertDialogContent className="max-w-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>End Academic Year: {selectedYear?.name}</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the academic year as completed and prepare for the next year.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4 py-4">
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800 text-sm">
                <strong>Important:</strong> This action cannot be undone. All selected operations will be performed immediately.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                <Checkbox
                  id="promote"
                  checked={promoteStudents}
                  onCheckedChange={(checked) => setPromoteStudents(checked as boolean)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <label
                    htmlFor="promote"
                    className="text-sm font-semibold cursor-pointer"
                  >
                    Promote Students to Next Grade
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Move students from their current class to the next grade level (e.g., Class 1 → Class 2).
                    Students in graduating classes (e.g., SHS 3) will be marked as graduated.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                <Checkbox
                  id="fees"
                  checked={carryOverFees}
                  onCheckedChange={(checked) => setCarryOverFees(checked as boolean)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <label
                    htmlFor="fees"
                    className="text-sm font-semibold cursor-pointer"
                  >
                    Carry Over Unpaid Fees
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Transfer outstanding fee balances to the next academic year. 
                    Students will need to clear these before new fees can be paid.
                    {!academicYears.find(y => 
                      y.id !== selectedYear?.id && 
                      selectedYear?.endDate && 
                      y.startDate.toDate().getTime() > selectedYear.endDate.toDate().getTime()
                    ) && (
                      <span className="text-orange-600 block mt-1">
                        ⚠️ No future academic year found. Create the next year first.
                      </span>
                    )}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                <Checkbox
                  id="archive"
                  checked={archiveData}
                  onCheckedChange={(checked) => setArchiveData(checked as boolean)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <label
                    htmlFor="archive"
                    className="text-sm font-semibold cursor-pointer"
                  >
                    Archive Year Data (Recommended)
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Create a permanent backup of all students, grades, attendance, and fees.
                    Archived data can be viewed and exported anytime from the Archives page.
                  </p>
                </div>
              </div>
            </div>

            {processing && (
              <div className="flex items-center justify-center gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <span className="text-sm text-blue-800 font-medium">Processing... This may take a few moments.</span>
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleEndYear}
              disabled={processing}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'End Academic Year'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Academic Year Transition Wizard */}
      {transitionDialog && currentYear && nextYear && (
        <AcademicYearTransitionWizard
          isOpen={transitionDialog}
          onClose={() => setTransitionDialog(false)}
          currentYear={currentYear}
          newYear={nextYear}
          onComplete={() => {
            setTransitionDialog(false);
            loadAcademicYears();
          }}
        />
      )}
    </div>
  );
}
