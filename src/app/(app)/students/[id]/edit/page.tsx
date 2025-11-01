'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getStudent, updateStudent, type Student } from '@/services/student';

export default function StudentEditPage() {
  const params = useParams();
  const router = useRouter();
  const { currentUser, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Student> | null>(null);

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
        setFormData(data);
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

  const handleSave = async () => {
    if (!formData || !studentId) return;

    try {
      setSaving(true);
      // Remove null values to avoid type issues
      const updateData = Object.fromEntries(
        Object.entries(formData).filter(([, value]) => value !== null && value !== undefined)
      );
      await updateStudent(studentId, updateData as any);
      
      toast({
        title: 'Success',
        description: 'Student updated successfully',
      });
      
      router.push(`/students/${studentId}`);
    } catch (error) {
      console.error('Error updating student:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update student',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!student || !formData) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
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
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          onClick={() => router.push(`/students/${studentId}`)}
          variant="ghost"
          size="icon"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <PageHeader
            title="Edit Student"
            description={`Updating ${student.firstName} ${student.lastName}`}
          />
        </div>
      </div>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Edit</CardTitle>
          <CardDescription>Update student information quickly</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* First Name */}
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName || ''}
                onChange={e =>
                  setFormData({...formData, firstName: e.target.value})
                }
              />
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName || ''}
                onChange={e =>
                  setFormData({...formData, lastName: e.target.value})
                }
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ''}
                onChange={e =>
                  setFormData({...formData, email: e.target.value})
                }
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone || ''}
                onChange={e =>
                  setFormData({...formData, phone: e.target.value})
                }
              />
            </div>

            {/* Current Class */}
            <div className="space-y-2">
              <Label htmlFor="currentClass">Current Class</Label>
              <Input
                id="currentClass"
                value={formData.currentClass || ''}
                onChange={e =>
                  setFormData({...formData, currentClass: e.target.value})
                }
              />
            </div>

            {/* Roll Number */}
            <div className="space-y-2">
              <Label htmlFor="rollNumber">Roll Number</Label>
              <Input
                id="rollNumber"
                value={formData.rollNumber || ''}
                onChange={e =>
                  setFormData({...formData, rollNumber: e.target.value})
                }
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status || 'active'}
                onValueChange={value =>
                  setFormData({
                    ...formData,
                    status: value as 'active' | 'inactive' | 'graduated' | 'transferred' | 'suspended',
                  })
                }
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="graduated">Graduated</SelectItem>
                  <SelectItem value="transferred">Transferred</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Withdrawal Reason (if applicable) */}
            {(formData.status === 'transferred' || formData.status === 'graduated' || formData.status === 'suspended') && (
              <div className="space-y-2">
                <Label htmlFor="withdrawalReason">Reason</Label>
                <Input
                  id="withdrawalReason"
                  value={formData.withdrawalReason || ''}
                  onChange={e =>
                    setFormData({...formData, withdrawalReason: e.target.value})
                  }
                  placeholder={`Reason for ${formData.status} status`}
                />
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={e =>
                setFormData({...formData, notes: e.target.value})
              }
              placeholder="Add any additional notes about this student"
              rows={4}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <Button
              onClick={() => router.push(`/students/${studentId}`)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-900">
            💡 <strong>Tip:</strong> For comprehensive edits including address, guardian, and medical information, please use the student registration form or contact support.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

