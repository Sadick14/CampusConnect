'use client';

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ChevronRight, ChevronLeft, CheckCircle2, AlertCircle, Loader2, Trash2 } from 'lucide-react';
import {
  StudentRegistrationSchema,
  type StudentRegistrationData,
} from '@/schemas/student';
import { createStudent } from '@/services/student';
import { getSchoolClasses } from '@/services/class';
import { getCurrentAcademicYear } from '@/services/academic-year';
import type { SchoolClass } from '@/schemas/class';
import { useToast } from '@/hooks/use-toast';

interface StudentRegistrationFormProps {
  organizationId: string;
  userId: string;
  onSuccess?: (studentId: string) => void;
}

type FormStep = 'personal' | 'academic' | 'address' | 'guardian' | 'medical' | 'payment' | 'review';

const STEPS: { key: FormStep; title: string; description: string }[] = [
  { key: 'personal', title: 'Personal Information', description: 'Basic student details' },
  { key: 'academic', title: 'Academic Details', description: 'Class and admission info' },
  { key: 'address', title: 'Address', description: 'Residential address' },
  { key: 'guardian', title: 'Guardian Details', description: 'Parent/Guardian information' },
  { key: 'medical', title: 'Medical Information', description: 'Health and medical details' },
  { key: 'payment', title: 'Fee Payment', description: 'Admission fee (optional)' },
  { key: 'review', title: 'Review & Submit', description: 'Confirm all information' },
];

export function StudentRegistrationForm({
  organizationId,
  userId,
  onSuccess,
}: StudentRegistrationFormProps) {
  const [currentStep, setCurrentStep] = useState<FormStep>('personal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [feePayments, setFeePayments] = useState<Array<{
    feeType: 'admission' | 'school_fees' | 'books' | 'uniform' | 'feeding' | 'transportation' | 'other';
    amount: number;
    paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'mobile_money' | 'cheque';
    transactionId?: string;
    notes?: string;
  }>>([]);
  const { toast } = useToast();

  // Fetch classes on mount
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoadingClasses(true);
        const academicYear = await getCurrentAcademicYear(organizationId);
        const classList = await getSchoolClasses(organizationId, academicYear?.year);
        setClasses(classList);
      } catch (error) {
        console.error('Error fetching classes:', error);
        toast({
          title: 'Error',
          description: 'Failed to load classes',
          variant: 'destructive',
        });
      } finally {
        setLoadingClasses(false);
      }
    };

    fetchClasses();
  }, [organizationId, toast]);

  const form = useForm<StudentRegistrationData>({
    resolver: zodResolver(StudentRegistrationSchema),
    mode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: 'male',
      email: '',
      phone: '',
      currentClass: '',
      section: '',
      rollNumber: '',
      admissionNumber: '',
      admissionDate: new Date().toISOString().split('T')[0],
      previousSchool: '',
      previousClass: '',
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      homePhone: '',
      guardianName: '',
      guardianRelationship: 'parent',
      guardianEmail: '',
      guardianPhone: '',
      guardianOccupation: '',
      secondaryGuardianName: '',
      secondaryGuardianEmail: '',
      secondaryGuardianPhone: '',
      allergies: '',
      chronicConditions: '',
      medicationsRequired: '',
      notes: '',
      feePayments: [],
    },
  });

  const currentStepIndex = STEPS.findIndex(s => s.key === currentStep);

  // Define which fields are required for each step
  const getStepFields = (step: FormStep): (keyof StudentRegistrationData)[] => {
    switch (step) {
      case 'personal':
        return ['firstName', 'lastName', 'dateOfBirth', 'gender'];
      case 'academic':
        return ['currentClass', 'admissionNumber', 'admissionDate'];
      case 'address':
        return ['street', 'city', 'state', 'postalCode', 'country'];
      case 'guardian':
        return ['guardianName', 'guardianRelationship', 'guardianEmail', 'guardianPhone'];
      case 'medical':
        return []; // No required fields in medical step
      case 'payment':
        return []; // Payment is optional
      case 'review':
        return []; // Review step doesn't have input fields
      default:
        return [];
    }
  };

  const handleNextStep = async () => {
    if (currentStep === 'review') {
      setShowConfirmDialog(true);
      return;
    }

    // Validate current step fields before moving to next
    const fieldsToValidate = getStepFields(currentStep);
    const isStepValid = await form.trigger(fieldsToValidate);

    if (!isStepValid) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields before continuing.',
        variant: 'destructive',
      });
      return;
    }

    const nextStepIndex = currentStepIndex + 1;
    if (nextStepIndex < STEPS.length) {
      setCurrentStep(STEPS[nextStepIndex].key);
    }
  };

  const handlePreviousStep = () => {
    const prevStepIndex = currentStepIndex - 1;
    if (prevStepIndex >= 0) {
      setCurrentStep(STEPS[prevStepIndex].key);
    }
  };

  const onSubmit = async (data: StudentRegistrationData) => {
    try {
      setIsSubmitting(true);

      // Add fee payments to the data
      const submissionData = {
        ...data,
        feePayments: feePayments,
      };

      const student = await createStudent(organizationId, submissionData, userId, false);

      toast({
        title: 'Success!',
        description: `${data.firstName} ${data.lastName} has been registered successfully.`,
      });

      form.reset();
      setCurrentStep('personal');
      setFeePayments([]);
      setShowConfirmDialog(false);

      if (onSuccess) {
        onSuccess(student.id);
      }
    } catch (error) {
      console.error('Error creating student:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to register student',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAsDraft = async () => {
    try {
      setIsSavingDraft(true);

      // Validate minimum required fields
      const requiredFields: (keyof StudentRegistrationData)[] = [
        'firstName', 'lastName', 'dateOfBirth', 'gender',
        'currentClass', 'admissionNumber', 'admissionDate'
      ];
      
      const isValid = await form.trigger(requiredFields);
      
      if (!isValid) {
        toast({
          title: 'Validation Error',
          description: 'Please fill in at least the personal and academic information to save as draft.',
          variant: 'destructive',
        });
        return;
      }

      const data = form.getValues();
      const submissionData = {
        ...data,
        feePayments: feePayments,
      };
      const student = await createStudent(organizationId, submissionData, userId, true);

      toast({
        title: 'Draft Saved!',
        description: `Registration for ${data.firstName} ${data.lastName} has been saved as draft.`,
      });

      form.reset();
      setCurrentStep('personal');
      setFeePayments([]);

      if (onSuccess) {
        onSuccess(student.id);
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save draft',
        variant: 'destructive',
      });
    } finally {
      setIsSavingDraft(false);
    }
  };

  return (
    <>
      <div className="w-full">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            {STEPS.map((step, index) => (
              <React.Fragment key={step.key}>
                <div className="flex flex-col items-center z-10 bg-white px-2">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold mb-2 transition-all duration-300 ${
                      index === currentStepIndex
                        ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg scale-110'
                        : index < currentStepIndex
                        ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {index < currentStepIndex ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <span className="text-sm">{index + 1}</span>
                    )}
                  </div>
                  <p className={`text-xs font-medium text-center max-w-[80px] ${
                    index === currentStepIndex ? 'text-blue-600 font-semibold' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </p>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 transition-all duration-300 ${
                    index < currentStepIndex ? 'bg-green-500' : 'bg-gray-200'
                  }`} style={{ marginTop: '-45px' }} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-2xl border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-xl font-bold text-gray-900">{STEPS[currentStepIndex]?.title}</h3>
            <p className="text-sm text-gray-600 mt-1">{STEPS[currentStepIndex]?.description}</p>
          </div>

          <div className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* PERSONAL INFORMATION STEP */}
                {currentStep === 'personal' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="John" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="dateOfBirth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date of Birth *</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gender *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                                <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="student@example.com" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input placeholder="1234567890" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                {/* ACADEMIC DETAILS STEP */}
                {currentStep === 'academic' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="currentClass"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Class *</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                              disabled={loadingClasses}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={loadingClasses ? "Loading classes..." : "Select a class"} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {classes.map((cls) => (
                                  <SelectItem key={cls.id} value={cls.id}>
                                    {cls.name} {cls.section ? `- ${cls.section}` : ''}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Select the class for this student
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="rollNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Roll Number</FormLabel>
                            <FormControl>
                              <Input placeholder="15" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="admissionNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Admission Number *</FormLabel>
                            <FormControl>
                              <Input placeholder="STU-2024-001" {...field} />
                            </FormControl>
                            <FormDescription>
                              Unique identifier for this student
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="admissionDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Admission Date *</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="previousSchool"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Previous School</FormLabel>
                            <FormControl>
                              <Input placeholder="ABC High School" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="previousClass"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Previous Class</FormLabel>
                            <FormControl>
                              <Input placeholder="9-B" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                {/* ADDRESS STEP */}
                {currentStep === 'address' && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="street"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Street Address *</FormLabel>
                          <FormControl>
                            <Input placeholder="123 Main Street" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City *</FormLabel>
                            <FormControl>
                              <Input placeholder="New York" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State *</FormLabel>
                            <FormControl>
                              <Input placeholder="NY" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="postalCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Postal Code *</FormLabel>
                            <FormControl>
                              <Input placeholder="10001" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country *</FormLabel>
                            <FormControl>
                              <Input placeholder="USA" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="homePhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Home Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="123-456-7890" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* GUARDIAN DETAILS STEP */}
                {currentStep === 'guardian' && (
                  <div className="space-y-6">
                    {/* Primary Guardian */}
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h3 className="font-semibold mb-4 text-lg">Primary Guardian</h3>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="guardianName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="Parent/Guardian name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="guardianRelationship"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Relationship *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="parent">Parent</SelectItem>
                                  <SelectItem value="guardian">Guardian</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <FormField
                          control={form.control}
                          name="guardianEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email *</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="guardian@example.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="guardianPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone *</FormLabel>
                              <FormControl>
                                <Input placeholder="1234567890" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="guardianOccupation"
                        render={({ field }) => (
                          <FormItem className="mt-4">
                            <FormLabel>Occupation</FormLabel>
                            <FormControl>
                              <Input placeholder="Engineer, Doctor, etc." {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Secondary Guardian */}
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-semibold mb-4 text-lg">Secondary Guardian (Optional)</h3>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="secondaryGuardianName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Secondary guardian name" {...field} value={field.value || ''} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="secondaryGuardianEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="guardian2@example.com" {...field} value={field.value || ''} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="secondaryGuardianPhone"
                        render={({ field }) => (
                          <FormItem className="mt-4">
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input placeholder="1234567890" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                {/* MEDICAL INFORMATION STEP */}
                {currentStep === 'medical' && (
                  <div className="space-y-4">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        This information is used for emergency purposes and health-related decisions
                      </AlertDescription>
                    </Alert>

                    <FormField
                      control={form.control}
                      name="bloodGroup"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Blood Group</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value || ''}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select blood group" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="O+">O+</SelectItem>
                              <SelectItem value="O-">O-</SelectItem>
                              <SelectItem value="A+">A+</SelectItem>
                              <SelectItem value="A-">A-</SelectItem>
                              <SelectItem value="B+">B+</SelectItem>
                              <SelectItem value="B-">B-</SelectItem>
                              <SelectItem value="AB+">AB+</SelectItem>
                              <SelectItem value="AB-">AB-</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="allergies"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Allergies</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Any known allergies (e.g., peanuts, penicillin, etc.)"
                              {...field}
                              value={field.value || ''}
                              rows={3}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="chronicConditions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Chronic Conditions</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Any chronic health conditions (e.g., asthma, diabetes, etc.)"
                              {...field}
                              value={field.value || ''}
                              rows={3}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="medicationsRequired"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Medications Required</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Any regular medications"
                              {...field}
                              value={field.value || ''}
                              rows={3}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Notes</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Any other important information"
                              {...field}
                              value={field.value || ''}
                              rows={3}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* FEE PAYMENT STEP */}
                {currentStep === 'payment' && (
                  <div className="space-y-6">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Fee payments are optional during registration. You can add multiple fee types if payments are made now, or skip and record them later.
                      </AlertDescription>
                    </Alert>

                    {/* Add Fee Payment Form */}
                    <div className="p-4 bg-blue-50 rounded-lg space-y-4">
                      <h4 className="font-semibold text-sm">Add Fee Payment</h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm">Fee Type *</Label>
                          <Select
                            value={undefined}
                            onValueChange={(value) => {
                              const feeType = value as 'admission' | 'school_fees' | 'books' | 'uniform' | 'feeding' | 'transportation' | 'other';
                              // Store temporarily
                              (window as any).tempFeeType = feeType;
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select fee type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admission">Admission Fee</SelectItem>
                              <SelectItem value="school_fees">School Fees</SelectItem>
                              <SelectItem value="books">Books/Materials</SelectItem>
                              <SelectItem value="uniform">Uniform</SelectItem>
                              <SelectItem value="feeding">Feeding/Cafeteria</SelectItem>
                              <SelectItem value="transportation">Transportation</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm">Amount *</Label>
                          <Input
                            type="number"
                            placeholder="0.00"
                            onChange={(e) => {
                              (window as any).tempAmount = parseFloat(e.target.value);
                            }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm">Payment Method *</Label>
                          <Select
                            onValueChange={(value) => {
                              (window as any).tempPaymentMethod = value;
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cash">Cash</SelectItem>
                              <SelectItem value="card">Card</SelectItem>
                              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                              <SelectItem value="mobile_money">Mobile Money</SelectItem>
                              <SelectItem value="cheque">Cheque</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm">Transaction/Receipt ID</Label>
                          <Input
                            placeholder="Optional"
                            onChange={(e) => {
                              (window as any).tempTransactionId = e.target.value;
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm">Notes (Optional)</Label>
                        <Textarea
                          placeholder="Additional notes about this payment"
                          rows={2}
                          onChange={(e) => {
                            (window as any).tempNotes = e.target.value;
                          }}
                        />
                      </div>

                      <Button
                        type="button"
                        onClick={() => {
                          const win = window as any;
                          if (win.tempFeeType && win.tempAmount && win.tempPaymentMethod) {
                            const newPayment = {
                              feeType: win.tempFeeType,
                              amount: win.tempAmount,
                              paymentMethod: win.tempPaymentMethod,
                              transactionId: win.tempTransactionId || '',
                              notes: win.tempNotes || '',
                            };
                            setFeePayments([...feePayments, newPayment]);
                            // Clear temp values
                            delete win.tempFeeType;
                            delete win.tempAmount;
                            delete win.tempPaymentMethod;
                            delete win.tempTransactionId;
                            delete win.tempNotes;
                            toast({
                              title: 'Fee Added',
                              description: 'Payment has been added to the list.',
                            });
                          } else {
                            toast({
                              title: 'Missing Fields',
                              description: 'Please fill in fee type, amount, and payment method.',
                              variant: 'destructive',
                            });
                          }
                        }}
                        className="w-full"
                      >
                        Add Payment
                      </Button>
                    </div>

                    {/* List of Added Payments */}
                    {feePayments.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Payments to Record ({feePayments.length})</h4>
                        {feePayments.map((payment, index) => (
                          <div key={index} className="p-4 bg-white border rounded-lg flex justify-between items-start">
                            <div className="space-y-1">
                              <p className="font-medium capitalize">{payment.feeType.replace('_', ' ')}</p>
                              <p className="text-sm text-gray-600">
                                Amount: GH₵{payment.amount.toFixed(2)} • {payment.paymentMethod.replace('_', ' ')}
                              </p>
                              {payment.transactionId && (
                                <p className="text-xs text-gray-500">Ref: {payment.transactionId}</p>
                              )}
                              {payment.notes && (
                                <p className="text-xs text-gray-500">{payment.notes}</p>
                              )}
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setFeePayments(feePayments.filter((_, i) => i !== index));
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        ))}
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm font-semibold text-green-800">
                            Total: GH₵{feePayments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* REVIEW STEP */}
                {currentStep === 'review' && (
                  <div className="space-y-4">
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        Please review all information before submitting
                      </AlertDescription>
                    </Alert>

                    <div className="grid grid-cols-2 gap-6 bg-gray-50 p-6 rounded-lg max-h-[400px] overflow-y-auto">
                      {/* Personal Info Review */}
                      <div>
                        <h4 className="font-semibold mb-2">Personal Information</h4>
                        <div className="text-sm space-y-1">
                          <p><span className="font-medium">Name:</span> {form.getValues('firstName')} {form.getValues('lastName')}</p>
                          <p><span className="font-medium">DOB:</span> {form.getValues('dateOfBirth')}</p>
                          <p><span className="font-medium">Gender:</span> {form.getValues('gender')}</p>
                          <p><span className="font-medium">Email:</span> {form.getValues('email') || 'N/A'}</p>
                          <p><span className="font-medium">Phone:</span> {form.getValues('phone') || 'N/A'}</p>
                        </div>
                      </div>

                      {/* Academic Info Review */}
                      <div>
                        <h4 className="font-semibold mb-2">Academic Details</h4>
                        <div className="text-sm space-y-1">
                          <p><span className="font-medium">Class:</span> {form.getValues('currentClass')}</p>
                          <p><span className="font-medium">Admission #:</span> {form.getValues('admissionNumber')}</p>
                          <p><span className="font-medium">Section:</span> {form.getValues('section') || 'N/A'}</p>
                          <p><span className="font-medium">Roll #:</span> {form.getValues('rollNumber') || 'N/A'}</p>
                          <p><span className="font-medium">Admission Date:</span> {form.getValues('admissionDate')}</p>
                        </div>
                      </div>

                      {/* Address Review */}
                      <div>
                        <h4 className="font-semibold mb-2">Address</h4>
                        <div className="text-sm space-y-1">
                          <p>{form.getValues('street')}</p>
                          <p>{form.getValues('city')}, {form.getValues('state')} {form.getValues('postalCode')}</p>
                          <p>{form.getValues('country')}</p>
                        </div>
                      </div>

                      {/* Guardian Review */}
                      <div>
                        <h4 className="font-semibold mb-2">Primary Guardian</h4>
                        <div className="text-sm space-y-1">
                          <p><span className="font-medium">Name:</span> {form.getValues('guardianName')}</p>
                          <p><span className="font-medium">Email:</span> {form.getValues('guardianEmail')}</p>
                          <p><span className="font-medium">Phone:</span> {form.getValues('guardianPhone')}</p>
                        </div>
                      </div>

                      {/* Fee Payments Review */}
                      {feePayments.length > 0 && (
                        <div className="col-span-2">
                          <h4 className="font-semibold mb-2">Fee Payments ({feePayments.length})</h4>
                          <div className="space-y-2">
                            {feePayments.map((payment, index) => (
                              <div key={index} className="text-sm p-2 bg-white rounded border">
                                <span className="font-medium capitalize">{payment.feeType.replace('_', ' ')}</span>
                                <span className="text-gray-600"> • GH₵{payment.amount.toFixed(2)} • {payment.paymentMethod.replace('_', ' ')}</span>
                                {payment.transactionId && <span className="text-gray-500 text-xs"> (Ref: {payment.transactionId})</span>}
                              </div>
                            ))}
                            <div className="font-semibold text-green-700">
                              Total Paid: GH₵{feePayments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between gap-4 pt-6">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePreviousStep}
                      disabled={currentStepIndex === 0 || isSavingDraft}
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Previous
                    </Button>

                    {currentStepIndex >= 1 && (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={handleSaveAsDraft}
                        disabled={isSavingDraft || isSubmitting}
                      >
                        {isSavingDraft ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          'Save as Draft'
                        )}
                      </Button>
                    )}
                  </div>

                  <Button
                    type="button"
                    onClick={handleNextStep}
                    disabled={(isSubmitting || isSavingDraft) && currentStep === 'review'}
                  >
                    {currentStep === 'review' ? (
                      isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Registering...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Register Student
                        </>
                      )
                    ) : (
                      <>
                        Next
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Student Registration</DialogTitle>
            <DialogDescription>
              Are you sure you want to register this student? Please verify that all information is correct.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm">
                <span className="font-semibold">Student Name:</span> {form.getValues('firstName')} {form.getValues('lastName')}
              </p>
              <p className="text-sm">
                <span className="font-semibold">Class:</span> {form.getValues('currentClass')}
              </p>
              <p className="text-sm">
                <span className="font-semibold">Admission Number:</span> {form.getValues('admissionNumber')}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                try {
                  const isValid = await form.trigger();
                  if (!isValid) {
                    // Show validation errors
                    toast({
                      title: 'Validation Error',
                      description: 'Please check all required fields are filled correctly.',
                      variant: 'destructive',
                    });
                    setShowConfirmDialog(false);
                    return;
                  }
                  await onSubmit(form.getValues());
                } catch (error) {
                  console.error('Confirm button error:', error);
                  toast({
                    title: 'Error',
                    description: error instanceof Error ? error.message : 'Failed to register student',
                    variant: 'destructive',
                  });
                }
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Confirm & Register
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
