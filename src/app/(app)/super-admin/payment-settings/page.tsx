'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Smartphone,
  Building2,
  Wallet,
  FileText,
  Plus,
  Trash2,
  Save,
  Loader2,
  Info,
  AlertTriangle,
} from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { getPaymentSettings, updatePaymentSettings } from '@/services/payment-settings';
import type {
  PaymentSettings,
  MobileMoneyAccount,
  BankAccount,
  CashPaymentDetails,
  ChequePaymentDetails,
  OtherPaymentDetails,
} from '@/schemas/payment-settings';

export default function PaymentSettingsPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);

  // Mobile Money Accounts
  const [mobileMoneyAccounts, setMobileMoneyAccounts] = useState<MobileMoneyAccount[]>([]);

  // Bank Accounts
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);

  // Cash Payment
  const [cashPayment, setCashPayment] = useState<CashPaymentDetails>({
    officeAddress: '',
    contactPerson: '',
    contactPhone: '',
    openingHours: '',
    instructions: '',
  });

  // Cheque Payment
  const [chequePayment, setChequePayment] = useState<ChequePaymentDetails>({
    payableTo: '',
    mailingAddress: '',
    contactPerson: '',
    contactPhone: '',
    instructions: '',
  });

  // Other Payment
  const [otherPayment, setOtherPayment] = useState<OtherPaymentDetails>({
    method: '',
    details: '',
    instructions: '',
  });

  // Check super admin access
  useEffect(() => {
    if (currentUser && currentUser.role !== 'superadmin') {
      router.push('/dashboard');
    }
  }, [currentUser, router]);

  // Load payment settings
  useEffect(() => {
    async function loadSettings() {
      if (!currentUser || currentUser.role !== 'superadmin') return;

      try {
        setLoading(true);
        const settings = await getPaymentSettings();
        
        if (settings) {
          setEnabled(settings.enabled);
          setMobileMoneyAccounts(settings.mobileMoneyAccounts || []);
          setBankAccounts(settings.bankAccounts || []);
          setCashPayment(settings.cashPayment || {
            officeAddress: '',
            contactPerson: '',
            contactPhone: '',
            openingHours: '',
            instructions: '',
          });
          setChequePayment(settings.chequePayment || {
            payableTo: '',
            mailingAddress: '',
            contactPerson: '',
            contactPhone: '',
            instructions: '',
          });
          setOtherPayment(settings.otherPayment || {
            method: '',
            details: '',
            instructions: '',
          });
        }
      } catch (error) {
        console.error('Error loading payment settings:', error);
        toast({
          title: 'Error',
          description: 'Failed to load payment settings',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, [currentUser, toast]);

  // Mobile Money Functions
  const addMobileMoneyAccount = () => {
    setMobileMoneyAccounts([
      ...mobileMoneyAccounts,
      { provider: 'MTN', accountName: '', phoneNumber: '', instructions: '' },
    ]);
  };

  const removeMobileMoneyAccount = (index: number) => {
    setMobileMoneyAccounts(mobileMoneyAccounts.filter((_, i) => i !== index));
  };

  const updateMobileMoneyAccount = (index: number, field: keyof MobileMoneyAccount, value: string) => {
    const updated = [...mobileMoneyAccounts];
    updated[index] = { ...updated[index], [field]: value };
    setMobileMoneyAccounts(updated);
  };

  // Bank Account Functions
  const addBankAccount = () => {
    setBankAccounts([
      ...bankAccounts,
      { bankName: '', accountName: '', accountNumber: '', branchName: '', swiftCode: '', instructions: '' },
    ]);
  };

  const removeBankAccount = (index: number) => {
    setBankAccounts(bankAccounts.filter((_, i) => i !== index));
  };

  const updateBankAccount = (index: number, field: keyof BankAccount, value: string) => {
    const updated = [...bankAccounts];
    updated[index] = { ...updated[index], [field]: value };
    setBankAccounts(updated);
  };

  // Save Settings
  const handleSave = async () => {
    if (!currentUser?.id) return;

    setSaving(true);
    try {
      const settings: Omit<PaymentSettings, 'id' | 'updatedAt'> = {
        mobileMoneyAccounts: mobileMoneyAccounts.filter(
          acc => acc.accountName && acc.phoneNumber
        ),
        bankAccounts: bankAccounts.filter(
          acc => acc.bankName && acc.accountName && acc.accountNumber
        ),
        cashPayment: cashPayment.officeAddress ? cashPayment : undefined,
        chequePayment: chequePayment.payableTo ? chequePayment : undefined,
        otherPayment: otherPayment.method ? otherPayment : undefined,
        enabled,
      };

      await updatePaymentSettings(settings, currentUser.id);

      toast({
        title: 'Settings Saved',
        description: 'Payment account settings have been updated successfully',
      });
    } catch (error) {
      console.error('Error saving payment settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save payment settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (!currentUser || currentUser.role !== 'superadmin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Access denied. Super Admin privileges required.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Payment Account Settings"
        description="Configure payment account details that will be displayed to schools during payment submission"
      />

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          These payment details will be shown to schools when they submit payments. Make sure all information is accurate and up-to-date.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payment Accounts Status</CardTitle>
              <CardDescription>Enable or disable payment account display</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="enabled">Display Payment Accounts</Label>
              <Switch
                id="enabled"
                checked={enabled}
                onCheckedChange={setEnabled}
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="mobile_money" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="mobile_money">
            <Smartphone className="h-4 w-4 mr-2" />
            Mobile Money
          </TabsTrigger>
          <TabsTrigger value="bank">
            <Building2 className="h-4 w-4 mr-2" />
            Bank Transfer
          </TabsTrigger>
          <TabsTrigger value="cash">
            <Wallet className="h-4 w-4 mr-2" />
            Cash
          </TabsTrigger>
          <TabsTrigger value="cheque">
            <FileText className="h-4 w-4 mr-2" />
            Cheque
          </TabsTrigger>
          <TabsTrigger value="other">Other</TabsTrigger>
        </TabsList>

        {/* Mobile Money Accounts */}
        <TabsContent value="mobile_money" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Mobile Money Accounts</CardTitle>
                  <CardDescription>Add mobile money accounts for payment</CardDescription>
                </div>
                <Button onClick={addMobileMoneyAccount} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Account
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {mobileMoneyAccounts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No mobile money accounts added. Click "Add Account" to get started.
                </p>
              ) : (
                mobileMoneyAccounts.map((account, index) => (
                  <Card key={index}>
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">Account {index + 1}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMobileMoneyAccount(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <div className="grid gap-4">
                        <div>
                          <Label>Provider</Label>
                          <Select
                            value={account.provider}
                            onValueChange={(value) =>
                              updateMobileMoneyAccount(index, 'provider', value as any)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="MTN">MTN Mobile Money</SelectItem>
                              <SelectItem value="Vodafone">Vodafone Cash</SelectItem>
                              <SelectItem value="AirtelTigo">AirtelTigo Money</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Account Name</Label>
                          <Input
                            value={account.accountName}
                            onChange={(e) =>
                              updateMobileMoneyAccount(index, 'accountName', e.target.value)
                            }
                            placeholder="e.g., CampusConnect Payments"
                          />
                        </div>
                        <div>
                          <Label>Phone Number</Label>
                          <Input
                            value={account.phoneNumber}
                            onChange={(e) =>
                              updateMobileMoneyAccount(index, 'phoneNumber', e.target.value)
                            }
                            placeholder="e.g., 0241234567"
                          />
                        </div>
                        <div>
                          <Label>Instructions (Optional)</Label>
                          <Textarea
                            value={account.instructions || ''}
                            onChange={(e) =>
                              updateMobileMoneyAccount(index, 'instructions', e.target.value)
                            }
                            placeholder="Additional instructions for schools..."
                            rows={2}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bank Accounts */}
        <TabsContent value="bank" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Bank Transfer Accounts</CardTitle>
                  <CardDescription>Add bank accounts for transfer payments</CardDescription>
                </div>
                <Button onClick={addBankAccount} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Account
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {bankAccounts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No bank accounts added. Click "Add Account" to get started.
                </p>
              ) : (
                bankAccounts.map((account, index) => (
                  <Card key={index}>
                    <CardContent className="pt-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">Account {index + 1}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBankAccount(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <Label>Bank Name</Label>
                          <Input
                            value={account.bankName}
                            onChange={(e) =>
                              updateBankAccount(index, 'bankName', e.target.value)
                            }
                            placeholder="e.g., GCB Bank"
                          />
                        </div>
                        <div>
                          <Label>Account Name</Label>
                          <Input
                            value={account.accountName}
                            onChange={(e) =>
                              updateBankAccount(index, 'accountName', e.target.value)
                            }
                            placeholder="e.g., CampusConnect Ltd"
                          />
                        </div>
                        <div>
                          <Label>Account Number</Label>
                          <Input
                            value={account.accountNumber}
                            onChange={(e) =>
                              updateBankAccount(index, 'accountNumber', e.target.value)
                            }
                            placeholder="e.g., 1234567890"
                          />
                        </div>
                        <div>
                          <Label>Branch Name (Optional)</Label>
                          <Input
                            value={account.branchName || ''}
                            onChange={(e) =>
                              updateBankAccount(index, 'branchName', e.target.value)
                            }
                            placeholder="e.g., Accra Main Branch"
                          />
                        </div>
                        <div>
                          <Label>SWIFT Code (Optional)</Label>
                          <Input
                            value={account.swiftCode || ''}
                            onChange={(e) =>
                              updateBankAccount(index, 'swiftCode', e.target.value)
                            }
                            placeholder="e.g., GCBKGHAC"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label>Instructions (Optional)</Label>
                          <Textarea
                            value={account.instructions || ''}
                            onChange={(e) =>
                              updateBankAccount(index, 'instructions', e.target.value)
                            }
                            placeholder="Additional instructions for schools..."
                            rows={2}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cash Payment */}
        <TabsContent value="cash" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cash Payment Details</CardTitle>
              <CardDescription>Configure office details for cash payments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Office Address</Label>
                <Textarea
                  value={cashPayment.officeAddress}
                  onChange={(e) =>
                    setCashPayment({ ...cashPayment, officeAddress: e.target.value })
                  }
                  placeholder="e.g., No. 123 Independence Avenue, Accra"
                  rows={2}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Contact Person</Label>
                  <Input
                    value={cashPayment.contactPerson}
                    onChange={(e) =>
                      setCashPayment({ ...cashPayment, contactPerson: e.target.value })
                    }
                    placeholder="e.g., John Doe"
                  />
                </div>
                <div>
                  <Label>Contact Phone</Label>
                  <Input
                    value={cashPayment.contactPhone}
                    onChange={(e) =>
                      setCashPayment({ ...cashPayment, contactPhone: e.target.value })
                    }
                    placeholder="e.g., 0241234567"
                  />
                </div>
              </div>
              <div>
                <Label>Opening Hours</Label>
                <Input
                  value={cashPayment.openingHours}
                  onChange={(e) =>
                    setCashPayment({ ...cashPayment, openingHours: e.target.value })
                  }
                  placeholder="e.g., Monday - Friday: 9:00 AM - 5:00 PM"
                />
              </div>
              <div>
                <Label>Additional Instructions (Optional)</Label>
                <Textarea
                  value={cashPayment.instructions || ''}
                  onChange={(e) =>
                    setCashPayment({ ...cashPayment, instructions: e.target.value })
                  }
                  placeholder="Any additional information for schools paying by cash..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cheque Payment */}
        <TabsContent value="cheque" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cheque Payment Details</CardTitle>
              <CardDescription>Configure details for cheque payments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Payable To</Label>
                <Input
                  value={chequePayment.payableTo}
                  onChange={(e) =>
                    setChequePayment({ ...chequePayment, payableTo: e.target.value })
                  }
                  placeholder="e.g., CampusConnect Limited"
                />
              </div>
              <div>
                <Label>Mailing Address</Label>
                <Textarea
                  value={chequePayment.mailingAddress}
                  onChange={(e) =>
                    setChequePayment({ ...chequePayment, mailingAddress: e.target.value })
                  }
                  placeholder="e.g., P.O. Box 123, Accra"
                  rows={2}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Contact Person</Label>
                  <Input
                    value={chequePayment.contactPerson}
                    onChange={(e) =>
                      setChequePayment({ ...chequePayment, contactPerson: e.target.value })
                    }
                    placeholder="e.g., Jane Smith"
                  />
                </div>
                <div>
                  <Label>Contact Phone</Label>
                  <Input
                    value={chequePayment.contactPhone}
                    onChange={(e) =>
                      setChequePayment({ ...chequePayment, contactPhone: e.target.value })
                    }
                    placeholder="e.g., 0241234567"
                  />
                </div>
              </div>
              <div>
                <Label>Additional Instructions (Optional)</Label>
                <Textarea
                  value={chequePayment.instructions || ''}
                  onChange={(e) =>
                    setChequePayment({ ...chequePayment, instructions: e.target.value })
                  }
                  placeholder="Any additional information for schools paying by cheque..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other Payment */}
        <TabsContent value="other" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Other Payment Method</CardTitle>
              <CardDescription>Configure alternative payment method details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Payment Method Name</Label>
                <Input
                  value={otherPayment.method}
                  onChange={(e) =>
                    setOtherPayment({ ...otherPayment, method: e.target.value })
                  }
                  placeholder="e.g., PayPal, Western Union, etc."
                />
              </div>
              <div>
                <Label>Payment Details</Label>
                <Textarea
                  value={otherPayment.details}
                  onChange={(e) =>
                    setOtherPayment({ ...otherPayment, details: e.target.value })
                  }
                  placeholder="Provide complete payment details for this method..."
                  rows={4}
                />
              </div>
              <div>
                <Label>Additional Instructions (Optional)</Label>
                <Textarea
                  value={otherPayment.instructions || ''}
                  onChange={(e) =>
                    setOtherPayment({ ...otherPayment, instructions: e.target.value })
                  }
                  placeholder="Any additional information..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
