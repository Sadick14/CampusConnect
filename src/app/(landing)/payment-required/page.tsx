'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { 
  Lock, 
  CreditCard, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  ArrowRight,
  Calculator
} from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { setSchoolPendingPayment } from '@/services/school-status';

interface PaymentPlan {
  type: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  price: number;
  currency: string;
  savings?: string;
  duration: string;
  popular?: boolean;
}

const paymentPlans: PaymentPlan[] = [
  {
    type: 'MONTHLY',
    price: 50,
    currency: 'GHS',
    duration: '1 Month'
  },
  {
    type: 'QUARTERLY',
    price: 135,
    currency: 'GHS',
    duration: '3 Months',
    savings: 'Save GHS 15',
    popular: true
  },
  {
    type: 'ANNUAL',
    price: 480,
    currency: 'GHS', 
    duration: '12 Months',
    savings: 'Save GHS 120'
  }
];

export default function PaymentRequiredPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<PaymentPlan | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Redirect if user is not logged in or is not a school admin
    if (!currentUser) {
      router.push('/login');
      return;
    }

    if (currentUser.role === 'superadmin') {
      router.push('/super-admin');
      return;
    }

    // If user has active subscription, redirect to dashboard
    // This would need to be implemented with actual school status check
  }, [currentUser, router]);

  const handlePlanSelection = (plan: PaymentPlan) => {
    setSelectedPlan(plan);
  };

  const handleProceedToPayment = async () => {
    if (!selectedPlan || !currentUser?.schoolId) {
      toast({
        title: "Selection Required",
        description: "Please select a payment plan to continue.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Set school to pending payment status
      await setSchoolPendingPayment(currentUser.schoolId);
      
      // Show payment instructions
      toast({
        title: "Payment Instructions Sent",
        description: "Your school has been marked as pending payment. Follow the payment instructions below.",
        duration: 8000
      });

      // In a real implementation, you would:
      // 1. Generate a payment reference number
      // 2. Redirect to payment gateway (e.g., Paystack, Flutterwave)
      // 3. Or show manual payment instructions

    } catch (error) {
      console.error('Error processing payment request:', error);
      toast({
        title: "Error",
        description: "Failed to process payment request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Account Access Suspended</h1>
          <p className="text-gray-600 mt-2 max-w-2xl mx-auto">
            Your {currentUser.schoolName} account trial has expired. Choose a subscription plan below to reactivate your account immediately.
          </p>
        </div>

        {/* Account Status Alert */}
        <Alert className="mb-8 border-red-200 bg-red-50 max-w-2xl mx-auto">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Account Locked</AlertTitle>
          <AlertDescription className="text-red-700">
            Your 14-day free trial has ended. All school data is safe and will be restored immediately after payment confirmation.
          </AlertDescription>
        </Alert>

        {/* Payment Plans */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {paymentPlans.map((plan) => (
            <Card 
              key={plan.type}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedPlan?.type === plan.type 
                  ? 'ring-2 ring-blue-500 shadow-lg' 
                  : 'hover:shadow-md'
              } ${plan.popular ? 'border-blue-500 relative' : ''}`}
              onClick={() => handlePlanSelection(plan)}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500">
                  Most Popular
                </Badge>
              )}
              
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-lg">{plan.duration}</CardTitle>
                <div className="space-y-1">
                  <div className="text-3xl font-bold">
                    {plan.currency} {plan.price}
                  </div>
                  {plan.savings && (
                    <div className="text-sm text-green-600 font-medium">
                      {plan.savings}
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Unlimited students & staff
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Full feature access
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Email notifications
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Data backup & security
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Priority support
                  </li>
                </ul>
              </CardContent>
              
              <CardFooter>
                <Button 
                  variant={selectedPlan?.type === plan.type ? "default" : "outline"}
                  className="w-full"
                >
                  {selectedPlan?.type === plan.type ? "Selected" : "Select Plan"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Payment Button */}
        {selectedPlan && (
          <div className="max-w-md mx-auto">
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center gap-2">
                    <Calculator className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">
                      Selected: {selectedPlan.duration}
                    </span>
                  </div>
                  
                  <div className="text-2xl font-bold text-green-900">
                    {selectedPlan.currency} {selectedPlan.price}
                  </div>
                  
                  {selectedPlan.savings && (
                    <div className="text-sm text-green-600">
                      {selectedPlan.savings} compared to monthly
                    </div>
                  )}
                  
                  <Button 
                    onClick={handleProceedToPayment}
                    disabled={loading}
                    className="w-full h-12 text-lg bg-green-600 hover:bg-green-700"
                  >
                    {loading ? (
                      <>
                        <Clock className="mr-2 h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-5 w-5" />
                        Proceed to Payment
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Payment Instructions */}
        <Alert className="mt-8 max-w-2xl mx-auto">
          <CreditCard className="h-4 w-4" />
          <AlertTitle>Payment Instructions</AlertTitle>
          <AlertDescription>
            <div className="mt-2 space-y-2 text-sm">
              <p><strong>Mobile Money:</strong> MTN/Vodafone/AirtelTigo accepted</p>
              <p><strong>Bank Transfer:</strong> Direct bank transfer available</p>
              <p><strong>Processing Time:</strong> Payments are confirmed within 2-4 hours</p>
              <p><strong>Immediate Access:</strong> Your account will be reactivated automatically after payment confirmation</p>
            </div>
          </AlertDescription>
        </Alert>

        {/* Support */}
        <div className="text-center mt-8 text-sm text-gray-500">
          Need help? Contact our support team at support@syntra.app
        </div>
      </div>
    </div>
  );
}