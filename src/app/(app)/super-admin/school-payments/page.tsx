'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/common/page-header';
import { 
  Lock, 
  Unlock, 
  CreditCard, 
  AlertCircle, 
  CheckCircle2,
  Clock,
  RefreshCw,
  Eye
} from "lucide-react";
import { School } from '@/schemas/school';
import { 
  getSchoolsNeedingAttention, 
  unlockSchoolAfterPayment,
  lockExpiredSchools 
} from '@/services/school-status';

interface PaymentConfirmation {
  organizationId: string;
  subscriptionType: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  paymentAmount: number;
  paymentReference: string;
}

export default function SchoolPaymentManagementPage() {
  const [schools, setSchools] = useState<{
    expired: School[];
    locked: School[];
    pendingPayment: School[];
  }>({ expired: [], locked: [], pendingPayment: [] });
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentConfirmation>({
    organizationId: '',
    subscriptionType: 'MONTHLY',
    paymentAmount: 50,
    paymentReference: ''
  });
  
  const { toast } = useToast();

  useEffect(() => {
    loadSchoolsData();
  }, []);

  const loadSchoolsData = async () => {
    setLoading(true);
    try {
      const data = await getSchoolsNeedingAttention();
      setSchools(data);
    } catch (error) {
      console.error('Failed to load schools data:', error);
      toast({
        title: "Error",
        description: "Failed to load schools data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRunExpiryCheck = async () => {
    setActionLoading('expiry-check');
    try {
      const response = await fetch('/api/cron/check-school-trials', {
        method: 'POST'
      });
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Expiry Check Complete",
          description: `${result.locked} schools were locked due to expired trials`,
        });
        await loadSchoolsData();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Failed to run expiry check:', error);
      toast({
        title: "Error",
        description: "Failed to run expiry check",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmPayment = async () => {
    if (!selectedSchool || !paymentData.paymentReference) {
      toast({
        title: "Missing Information",
        description: "Please fill in all payment details",
        variant: "destructive"
      });
      return;
    }

    setActionLoading(`unlock-${selectedSchool.id}`);
    try {
      await unlockSchoolAfterPayment(
        selectedSchool.id,
        paymentData.subscriptionType,
        paymentData.paymentAmount
      );
      
      toast({
        title: "Payment Confirmed",
        description: `${selectedSchool.name} has been unlocked and activated`,
      });
      
      setSelectedSchool(null);
      setPaymentData({
        organizationId: '',
        subscriptionType: 'MONTHLY',
        paymentAmount: 50,
        paymentReference: ''
      });
      
      await loadSchoolsData();
    } catch (error) {
      console.error('Failed to confirm payment:', error);
      toast({
        title: "Error",
        description: "Failed to confirm payment and unlock school",
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>;
      case 'locked':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Locked</Badge>;
      case 'pending_payment':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700">Pending Payment</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPaymentAmount = (type: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL') => {
    switch (type) {
      case 'MONTHLY': return 50;
      case 'QUARTERLY': return 135;
      case 'ANNUAL': return 480;
      default: return 50;
    }
  };

  const allSchools = [...schools.expired, ...schools.locked, ...schools.pendingPayment];

  return (
    <div className="container mx-auto py-6">
      <PageHeader
        title="School Payment Management"
        description="Manage school subscriptions, confirm payments, and handle expired accounts"
      />

      {/* Action Buttons */}
      <div className="flex gap-4 mb-6">
        <Button 
          onClick={handleRunExpiryCheck}
          disabled={actionLoading === 'expiry-check'}
          variant="outline"
        >
          {actionLoading === 'expiry-check' ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Clock className="mr-2 h-4 w-4" />
          )}
          Run Expiry Check
        </Button>
        
        <Button onClick={loadSchoolsData} disabled={loading} variant="outline">
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired Trials</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{schools.expired.length}</div>
            <p className="text-xs text-muted-foreground">
              Schools with expired trials
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Locked Schools</CardTitle>
            <Lock className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-700">{schools.locked.length}</div>
            <p className="text-xs text-muted-foreground">
              Schools currently locked
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{schools.pendingPayment.length}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting payment confirmation
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Schools Table */}
      <Card>
        <CardHeader>
          <CardTitle>Schools Requiring Attention</CardTitle>
          <CardDescription>
            Schools with expired trials, locked accounts, or pending payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin" />
            </div>
          ) : allSchools.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p>All schools are active and up to date!</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>School Name</TableHead>
                  <TableHead>Admin Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Trial End Date</TableHead>
                  <TableHead>Last Payment</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allSchools.map((school) => (
                  <TableRow key={school.id}>
                    <TableCell className="font-medium">{school.name}</TableCell>
                    <TableCell>{school.adminEmail}</TableCell>
                    <TableCell>{getStatusBadge(school.subscriptionStatus)}</TableCell>
                    <TableCell>
                      {new Date(school.trialEndDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {school.lastPaymentDate 
                        ? new Date(school.lastPaymentDate).toLocaleDateString()
                        : 'Never'
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline"
                                onClick={() => {
                                setSelectedSchool(school);
                                setPaymentData(prev => ({
                                  ...prev,
                                  organizationId: school.id
                                }));
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>School Details: {school.name}</DialogTitle>
                              <DialogDescription>
                                View and manage school subscription status
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label>School Name</Label>
                                  <p className="text-sm text-muted-foreground">{school.name}</p>
                                </div>
                                <div>
                                  <Label>Admin Email</Label>
                                  <p className="text-sm text-muted-foreground">{school.adminEmail}</p>
                                </div>
                                <div>
                                  <Label>Current Status</Label>
                                  {getStatusBadge(school.subscriptionStatus)}
                                </div>
                                <div>
                                  <Label>Trial Period</Label>
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(school.trialStartDate).toLocaleDateString()} - {new Date(school.trialEndDate).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        {school.subscriptionStatus === 'pending_payment' && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm"
                                onClick={() => {
                                  setSelectedSchool(school);
                                  setPaymentData(prev => ({
                                    ...prev,
                                    organizationId: school.id
                                  }));
                                }}
                              >
                                <Unlock className="h-4 w-4 mr-1" />
                                Confirm Payment
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Confirm Payment for {school.name}</DialogTitle>
                                <DialogDescription>
                                  Confirm payment details to unlock the school account
                                </DialogDescription>
                              </DialogHeader>
                              
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="subscriptionType">Subscription Plan</Label>
                                  <Select 
                                    value={paymentData.subscriptionType}
                                    onValueChange={(value: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL') => {
                                      setPaymentData(prev => ({
                                        ...prev,
                                        subscriptionType: value,
                                        paymentAmount: getPaymentAmount(value)
                                      }));
                                    }}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="MONTHLY">Monthly - GHS 50</SelectItem>
                                      <SelectItem value="QUARTERLY">Quarterly - GHS 135 (Save GHS 15)</SelectItem>
                                      <SelectItem value="ANNUAL">Annual - GHS 480 (Save GHS 120)</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                <div>
                                  <Label htmlFor="paymentAmount">Payment Amount (GHS)</Label>
                                  <Input
                                    id="paymentAmount"
                                    type="number"
                                    value={paymentData.paymentAmount}
                                    onChange={(e) => setPaymentData(prev => ({
                                      ...prev,
                                      paymentAmount: Number(e.target.value)
                                    }))}
                                  />
                                </div>
                                
                                <div>
                                  <Label htmlFor="paymentReference">Payment Reference</Label>
                                  <Input
                                    id="paymentReference"
                                    placeholder="Enter payment reference/transaction ID"
                                    value={paymentData.paymentReference}
                                    onChange={(e) => setPaymentData(prev => ({
                                      ...prev,
                                      paymentReference: e.target.value
                                    }))}
                                  />
                                </div>
                              </div>
                              
                              <DialogFooter>
                                <Button 
                                  onClick={handleConfirmPayment}
                                  disabled={actionLoading === `unlock-${school.id}`}
                                >
                                  {actionLoading === `unlock-${school.id}` ? (
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                  )}
                                  Confirm & Unlock School
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}