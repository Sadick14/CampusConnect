'use client';

import React, { useState } from 'react';
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
import { ChevronRight, ChevronLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import {
  StudentRegistrationSchema,
  type StudentRegistrationData,
} from '@/schemas/student';
import { createStudent } from '@/services/student';
import { useToast } from '@/hooks/use-toast';

interface StudentRegistrationFormProps {
  schoolId: string;
  userId: string;
  onSuccess?: (studentId: string) => void;
}

type FormStep = 'personal' | 'academic' | 'address' | 'guardian' | 'medical' | 'review';

const STEPS: { key: FormStep; title: string; description: string }[] = [
  { key: 'personal', title: 'Personal Information', description: 'Basic student details' },
  { key: 'academic', title: 'Academic Details', description: 'Class and admission info' },
  { key: 'address', title: 'Address', description: 'Residential address' },
  { key: 'guardian', title: 'Guardian Details', description: 'Parent/Guardian information' },
  { key: 'medical', title: 'Medical Information', description: 'Health and medical details' },
  { key: 'review', title: 'Review & Submit', description: 'Confirm all information' },
];

export function StudentRegistrationForm({
  schoolId,
  userId,
  onSuccess,
}: StudentRegistrationFormProps) {
  const [currentStep, setCurrentStep] = useState<FormStep>('personal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { toast } = useToast();

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
      bloodGroup: '',
      allergies: '',
      chronicConditions: '',
      medicationsRequired: '',
      notes: '',
    },
  });

  const currentStepIndex = STEPS.findIndex(s => s.key === currentStep);

  const handleNextStep = async () => {
    if (currentStep === 'review') {
      setShowConfirmDialog(true);
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

      const student = await createStudent(schoolId, data, userId);

      toast({
        title: 'Success!',
        description: `${data.firstName} ${data.lastName} has been registered successfully.`,
      });

      form.reset();
      setCurrentStep('personal');
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

  return (
    <>
      <div className="w-full max-w-4xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex justify-between mb-4">
            {STEPS.map((step, index) => (
              <div key={step.key} className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold mb-2 ${
                    index === currentStepIndex
                      ? 'bg-blue-600 text-white'
                      : index < currentStepIndex
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {index < currentStepIndex ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    index + 1
                  )}
                </div>
                <p className={`text-xs font-medium text-center ${
                  index === currentStepIndex ? 'text-blue-600' : 'text-gray-600'
                }`}>
                  {step.title}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <Card>
          <CardHeader>
            <CardTitle>{STEPS[currentStepIndex]?.title}</CardTitle>
            <CardDescription>{STEPS[currentStepIndex]?.description}</CardDescription>
          </CardHeader>

          <CardContent>
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
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="currentClass"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Class *</FormLabel>
                            <FormControl>
                              <Input placeholder="10-A" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="section"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Section</FormLabel>
                            <FormControl>
                              <Input placeholder="A" {...field} value={field.value || ''} />
                            </FormControl>
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
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex justify-between gap-4 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePreviousStep}
                    disabled={currentStepIndex === 0}
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Previous
                  </Button>

                  <Button
                    type="button"
                    onClick={handleNextStep}
                    disabled={
                      currentStep === 'review'
                        ? isSubmitting
                        : !form.formState.isValid
                    }
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
          </CardContent>
        </Card>
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
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={form.handleSubmit(onSubmit)}
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
