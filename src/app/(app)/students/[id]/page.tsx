'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
  BookOpen,
  Heart,
  Users,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getStudent, deleteStudent, type Student } from '@/services/student';

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const studentId = params.id as string;

  // Fetch student
  useEffect(() => {
    const fetchStudent = async () => {
      if (!studentId) return;

      try {
        setLoading(true);
        const data = await getStudent(studentId);
        if (!data) {
          toast({
            title: 'Error',
            description: 'Student not found',
            variant: 'destructive',
          });
          router.push('/students');
          return;
        }
        setStudent(data);
      } catch (error) {
        console.error('Error fetching student:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch student details',
          variant: 'destructive',
        });
        router.push('/students');
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [studentId, toast, router]);

  // Handle delete
  const handleDelete = async () => {
    if (!studentId) return;

    try {
      setIsDeleting(true);
      await deleteStudent(studentId);
      
      toast({
        title: 'Success',
        description: 'Student deleted successfully',
      });
      
      setDeleteDialogOpen(false);
      router.push('/students');
    } catch (error) {
      console.error('Error deleting student:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete student',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-lg text-gray-600">Student not found</p>
        <Button
          onClick={() => router.push('/students')}
          className="mt-4"
          variant="outline"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Students
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Back button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => router.push('/students')}
            variant="ghost"
            size="icon"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <PageHeader
              title={`${student.firstName} ${student.lastName}`}
              description={`Student ID: ${student.studentIdNumber}`}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => router.push(`/students/${studentId}/edit`)}
            variant="outline"
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            onClick={() => setDeleteDialogOpen(true)}
            variant="destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600">First Name</p>
              <p className="text-lg font-semibold">{student.firstName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Last Name</p>
              <p className="text-lg font-semibold">{student.lastName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Date of Birth</p>
              <p className="text-lg font-semibold">
                {new Date(student.dateOfBirth).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Gender</p>
              <p className="text-lg font-semibold capitalize">{student.gender}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Student ID Number</p>
              <p className="text-lg font-mono font-semibold">{student.studentIdNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Admission Number</p>
              <p className="text-lg font-mono font-semibold">{student.admissionNumber}</p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {student.email && (
              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 text-gray-500 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="text-base">{student.email}</p>
                </div>
              </div>
            )}
            {student.phone && (
              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 text-gray-500 mt-1" />
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="text-base">{student.phone}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Academic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Academic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600">Current Class</p>
              <p className="text-lg font-semibold">{student.currentClass}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <Badge
                variant={
                  student.status === 'active'
                    ? 'default'
                    : student.status === 'inactive'
                    ? 'secondary'
                    : student.status === 'graduated'
                    ? 'outline'
                    : 'destructive'
                }
              >
                {student.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-600">Enrollment Date</p>
              <p className="text-base">
                {new Date(student.enrollmentDate).toLocaleDateString()}
              </p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {student.section && (
              <div>
                <p className="text-sm text-gray-600">Section</p>
                <p className="text-base">{student.section}</p>
              </div>
            )}
            {student.rollNumber && (
              <div>
                <p className="text-sm text-gray-600">Roll Number</p>
                <p className="text-base">{student.rollNumber}</p>
              </div>
            )}
          </div>

          {student.academicHistory && (
            <>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {student.academicHistory.previousSchool && (
                  <div>
                    <p className="text-sm text-gray-600">Previous School</p>
                    <p className="text-base">{student.academicHistory.previousSchool}</p>
                  </div>
                )}
                {student.academicHistory.previousClass && (
                  <div>
                    <p className="text-sm text-gray-600">Previous Class</p>
                    <p className="text-base">{student.academicHistory.previousClass}</p>
                  </div>
                )}
                {student.academicHistory.nclmLevel && (
                  <div>
                    <p className="text-sm text-gray-600">NCLM Level</p>
                    <p className="text-base">{student.academicHistory.nclmLevel}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Address Information */}
      {student.address && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Address Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {student.address.street && (
                <div>
                  <p className="text-sm text-gray-600">Street Address</p>
                  <p className="text-base">{student.address.street}</p>
                </div>
              )}
              {student.address.city && (
                <div>
                  <p className="text-sm text-gray-600">City</p>
                  <p className="text-base">{student.address.city}</p>
                </div>
              )}
              {student.address.state && (
                <div>
                  <p className="text-sm text-gray-600">State/Province</p>
                  <p className="text-base">{student.address.state}</p>
                </div>
              )}
              {student.address.postalCode && (
                <div>
                  <p className="text-sm text-gray-600">Postal Code</p>
                  <p className="text-base">{student.address.postalCode}</p>
                </div>
              )}
              {student.address.country && (
                <div>
                  <p className="text-sm text-gray-600">Country</p>
                  <p className="text-base">{student.address.country}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Guardian Information */}
      {student.guardians && student.guardians.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Guardian Information ({student.guardians.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {student.guardians.map((guardian, index) => (
              <div key={index}>
                <h3 className="font-semibold text-base mb-4">
                  {guardian.relationship === 'parent'
                    ? 'Parent'
                    : guardian.relationship === 'guardian'
                    ? 'Guardian'
                    : 'Other Contact'}{' '}
                  #{index + 1}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  {guardian.name && (
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="text-base font-semibold">{guardian.name}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600">Relationship</p>
                    <p className="text-base capitalize">{guardian.relationship}</p>
                  </div>
                  {guardian.email && (
                    <div className="flex items-start gap-2">
                      <Mail className="h-4 w-4 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="text-base">{guardian.email}</p>
                      </div>
                    </div>
                  )}
                  {guardian.phone && (
                    <div className="flex items-start gap-2">
                      <Phone className="h-4 w-4 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="text-base">{guardian.phone}</p>
                      </div>
                    </div>
                  )}
                  {guardian.occupation && (
                    <div>
                      <p className="text-sm text-gray-600">Occupation</p>
                      <p className="text-base">{guardian.occupation}</p>
                    </div>
                  )}
                  {guardian.isEmergencyContact && (
                    <div>
                      <Badge variant="outline">Emergency Contact</Badge>
                    </div>
                  )}
                </div>
                {index < student.guardians.length - 1 && <Separator className="mt-6" />}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Medical Information */}
      {student.medicalInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Medical Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {student.medicalInfo.bloodGroup && (
                <div>
                  <p className="text-sm text-gray-600">Blood Group</p>
                  <p className="text-lg font-semibold">{student.medicalInfo.bloodGroup}</p>
                </div>
              )}
              {student.medicalInfo.insuranceProvider && (
                <div>
                  <p className="text-sm text-gray-600">Insurance Provider</p>
                  <p className="text-base">{student.medicalInfo.insuranceProvider}</p>
                </div>
              )}
              {student.medicalInfo.insurancePolicyNumber && (
                <div>
                  <p className="text-sm text-gray-600">Insurance Policy Number</p>
                  <p className="text-base">{student.medicalInfo.insurancePolicyNumber}</p>
                </div>
              )}
            </div>

            {(student.medicalInfo.allergies ||
              student.medicalInfo.chronicConditions ||
              student.medicalInfo.medicationsRequired ||
              student.medicalInfo.emergencyMedicalInfo) && (
              <>
                <Separator />
                <div className="space-y-4">
                  {student.medicalInfo.allergies && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Allergies</p>
                      <p className="text-base">{student.medicalInfo.allergies}</p>
                    </div>
                  )}
                  {student.medicalInfo.chronicConditions && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Chronic Conditions</p>
                      <p className="text-base">{student.medicalInfo.chronicConditions}</p>
                    </div>
                  )}
                  {student.medicalInfo.medicationsRequired && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Medications Required</p>
                      <p className="text-base">{student.medicalInfo.medicationsRequired}</p>
                    </div>
                  )}
                  {student.medicalInfo.emergencyMedicalInfo && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Emergency Medical Info</p>
                      <p className="text-base">{student.medicalInfo.emergencyMedicalInfo}</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Additional Info */}
      <Card>
        <CardHeader>
          <CardTitle>
            <Calendar className="h-4 w-4 inline mr-2" />
            System Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600">Created At</p>
              <p className="text-base">
                {new Date(student.createdAt).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Last Updated</p>
              <p className="text-base">
                {new Date(student.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>
          {student.notes && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-gray-600">Notes</p>
                <p className="text-base whitespace-pre-wrap">{student.notes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Student</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {student.firstName} {student.lastName}? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-4">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
