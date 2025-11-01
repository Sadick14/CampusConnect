'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  GraduationCap, 
  Check,
  Menu,
  X,
  Sparkles,
  Zap,
  Crown,
  ArrowRight,
  Users
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';

export default function PricingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedDarkMode === 'true' || (!savedDarkMode && prefersDark);
    
    setDarkMode(shouldBeDark);
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    localStorage.setItem('darkMode', (!darkMode).toString());
    document.documentElement.classList.toggle('dark');
  };

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const pricingPlans = [
    {
      name: 'Trial',
      description: 'Try Syntra free for 30 days',
      icon: Sparkles,
      isTrial: true,
      upfrontFee: 0,
      perStudentFee: 0,
      trialDays: 30,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'from-blue-50 to-cyan-50/30',
      darkBgColor: 'from-blue-950/20 to-cyan-950/10',
      features: [
        'Full access to all features',
        'Up to 50 students',
        'Basic support',
        '30 days trial period',
        'No credit card required',
        'Student management',
        'Attendance tracking',
        'Grade management'
      ],
      limits: []
    },
    {
      name: 'Basic',
      description: 'Perfect for small to medium schools',
      icon: Zap,
      upfrontFee: 300,
      perStudentFee: 20,
      maxStudents: 200,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'from-green-50 to-emerald-50/30',
      darkBgColor: 'from-green-950/20 to-emerald-950/10',
      popular: true,
      features: [
        'Full access to all features',
        'Up to 200 students',
        'GHS 20 per student/month',
        'Email support',
        'Basic reporting',
        'Fee management',
        'Timetable management',
        'Parent notifications',
        'Student records'
      ],
      limits: []
    },
    {
      name: 'Standard',
      description: 'Most popular for growing schools',
      icon: Crown,
      upfrontFee: 500,
      perStudentFee: 20,
      maxStudents: 500,
      color: 'from-purple-500 to-indigo-500',
      bgColor: 'from-purple-50 to-indigo-50/30',
      darkBgColor: 'from-purple-950/20 to-indigo-950/10',
      features: [
        'Full access to all features',
        'Up to 500 students',
        'GHS 20 per student/month',
        'Priority support',
        'Advanced reporting',
        'SMS notifications',
        'Analytics dashboard',
        'Bulk operations',
        'Custom reports'
      ],
      limits: []
    },
    {
      name: 'Premium',
      description: 'For large institutions',
      icon: Crown,
      upfrontFee: 1000,
      perStudentFee: 20,
      maxStudents: -1,
      color: 'from-orange-500 to-pink-500',
      bgColor: 'from-orange-50 to-pink-50/30',
      darkBgColor: 'from-orange-950/20 to-pink-950/10',
      features: [
        'Full access to all features',
        'Unlimited students',
        'GHS 20 per student/month',
        '24/7 Priority support',
        'Advanced analytics',
        'Bulk SMS',
        'Custom branding',
        'API access',
        'Dedicated account manager',
        'On-site training',
        'Custom integrations'
      ],
      limits: []
    }
  ];

  const faqs = [
    {
      question: 'How does the pricing work?',
      answer: 'Our pricing has two components: a one-time setup fee (GHS 300-1,000 depending on plan) and a monthly fee of GHS 20 per active student. For example, a school with 100 students on the Basic plan pays GHS 300 upfront, then GHS 2,000/month (100 students × GHS 20).'
    },
    {
      question: 'What happens during the free trial?',
      answer: 'You get 30 days of full access to all features with up to 50 students. No credit card required. After the trial, choose a paid plan to continue using Syntra.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept Mobile Money (MTN, Vodafone, AirtelTigo), bank transfers, cash, and cheques. All payments require super admin approval before activation.'
    },
    {
      question: 'Can I upgrade or downgrade my plan?',
      answer: 'Yes! You can upgrade to a higher plan anytime by paying the difference in setup fees. Monthly billing automatically adjusts based on your current student count.'
    },
    {
      question: 'What happens if my student count changes?',
      answer: 'Your monthly billing automatically adjusts based on your active student count. You only pay for students currently enrolled in your system.'
    },
    {
      question: 'Is there a grace period for payments?',
      answer: 'Yes, we offer a 7-day grace period before accounts are locked. You\'ll receive reminders before your subscription expires.'
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 dark:bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-gray-900/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-green-600" />
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600">
              Syntra
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-6">
            <Link href="/#features" className="text-sm font-medium hover:text-green-600 transition-colors">
              Features
            </Link>
            <Link href="/pricing" className="text-sm font-medium text-green-600">
              Pricing
            </Link>
            <Link href="/#testimonials" className="text-sm font-medium hover:text-green-600 transition-colors">
              Testimonials
            </Link>
          </nav>
          
          <div className="flex gap-4 items-center">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            {currentUser ? (
              <Link href="/dashboard">
                <Button className="bg-green-600 hover:bg-green-700">Go to Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/login" className="hidden sm:block">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link href="/login">
                  <Button className="bg-green-600 hover:bg-green-700">Start Free Trial</Button>
                </Link>
              </>
            )}
            <button 
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-white dark:bg-gray-900 p-4">
            <nav className="flex flex-col gap-4">
              <Link href="/#features" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium hover:text-green-600 transition-colors">
                Features
              </Link>
              <Link href="/pricing" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-green-600">
                Pricing
              </Link>
              <Link href="/#testimonials" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium hover:text-green-600 transition-colors">
                Testimonials
              </Link>
              {currentUser ? (
                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-green-600 hover:bg-green-700">Go to Dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full">Sign In</Button>
                  </Link>
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full bg-green-600 hover:bg-green-700">Start Free Trial</Button>
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </header>

      <main>
        {/* Hero Section */}
        <section className="py-24 bg-gradient-to-br from-green-50 via-emerald-50/50 to-teal-50/30 dark:from-gray-900 dark:via-green-950/20 dark:to-gray-900 relative overflow-hidden">
          {/* Background decorations */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20">
            <div className="absolute top-20 right-20 w-72 h-72 bg-green-400 rounded-full blur-3xl animate-float"></div>
            <div className="absolute bottom-20 left-20 w-96 h-96 bg-emerald-400 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-16 animate-fade-in-up">
              <span className="inline-block px-6 py-2 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-300 font-bold text-sm mb-6 border-2 border-green-300 dark:border-green-700">
                SIMPLE, TRANSPARENT PRICING
              </span>
              <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 dark:text-white mb-6">
                <span className="block">Choose Your Perfect</span>
                <span className="block bg-gradient-to-r from-green-600 via-emerald-500 to-teal-500 bg-clip-text text-transparent mt-2">Plan Today</span>
              </h1>
              <p className="mt-6 max-w-3xl text-xl text-gray-600 dark:text-gray-300 mx-auto leading-relaxed">
                Flexible pricing designed to grow with your school. Start free, upgrade anytime.
              </p>
            </div>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4 mb-4 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <div className="px-6 py-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-center rounded-2xl border-2 border-green-300 dark:border-green-700">
                <p className="text-sm font-bold mb-1">💡 Flexible Pricing Model</p>
                <p className="text-xs">One-time activation fee + GHS 20 per student/month</p>
              </div>
            </div>
            <div className="text-center mb-16 text-sm text-gray-600 dark:text-gray-400">
              <p className="font-medium">Perfect for schools of all sizes • Pay only for active students</p>
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {pricingPlans.map((plan, index) => (
                <div 
                  key={plan.name}
                  className={`relative animate-scale-in ${plan.popular ? 'md:-mt-4' : ''}`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {plan.popular && (
                    <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 z-10">
                      <span className="inline-block px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-bold rounded-full shadow-lg">
                        MOST POPULAR
                      </span>
                    </div>
                  )}
                  <Card className={`h-full bg-gradient-to-br ${plan.bgColor} dark:${plan.darkBgColor} border-2 ${plan.popular ? 'border-green-500 dark:border-green-400 shadow-2xl shadow-green-500/20 scale-105' : 'border-gray-200 dark:border-gray-700'} hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 rounded-3xl overflow-hidden`}>
                    <CardHeader className="text-center pb-8 pt-12">
                      <div className="relative mb-6 flex justify-center">
                        <div className={`absolute inset-0 bg-gradient-to-br ${plan.color} rounded-2xl blur-lg opacity-30`}></div>
                        <div className={`relative flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br ${plan.color} text-white shadow-lg`}>
                          <plan.icon className="h-8 w-8" />
                        </div>
                      </div>
                      <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {plan.name}
                      </CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {plan.description}
                      </p>
                      <div className="mt-6">
                        {plan.isTrial ? (
                          <div>
                            <div className="flex items-baseline justify-center gap-2">
                              <span className="text-5xl font-extrabold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                                FREE
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 font-semibold">
                              30 days free trial
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold mb-1">One-time Setup</p>
                              <div className="flex items-baseline justify-center gap-2">
                                <span className="text-4xl font-extrabold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                  GHS {plan.upfrontFee}
                                </span>
                              </div>
                            </div>
                            <div className="pt-3 border-t-2 border-gray-200 dark:border-gray-700">
                              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold mb-1">Monthly Billing</p>
                              <div className="flex items-baseline justify-center gap-2">
                                <span className="text-3xl font-bold text-green-600 dark:text-green-400">
                                  GHS {plan.perStudentFee}
                                </span>
                                <span className="text-gray-600 dark:text-gray-400 font-medium">
                                  /student/month
                                </span>
                              </div>
                              {plan.maxStudents !== undefined && plan.maxStudents > 0 && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                  Up to {plan.maxStudents} students
                                </p>
                              )}
                              {plan.maxStudents === -1 && (
                                <p className="text-xs text-green-600 dark:text-green-400 mt-2 font-semibold">
                                  Unlimited students
                                </p>
                              )}
                            </div>
                            <div className="pt-2">
                              <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                                Example: 100 students = GHS {plan.upfrontFee} + GHS {plan.perStudentFee! * 100}/mo
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="px-6 pb-8">
                      <Link href="/login">
                        <Button 
                          className={`w-full mb-6 font-bold py-6 text-lg rounded-2xl transform transition-all duration-300 hover:scale-105 ${
                            plan.popular 
                              ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg' 
                              : plan.isTrial
                              ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg'
                              : 'bg-white dark:bg-gray-800 text-green-700 dark:text-green-300 border-2 border-green-600 dark:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/30'
                          }`}
                        >
                          {plan.isTrial ? 'Start 30-Day Free Trial →' : 'Get Started →'}
                        </Button>
                      </Link>
                      <ul className="space-y-4">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <div className="mt-0.5 flex-shrink-0">
                              <div className="h-5 w-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                              </div>
                            </div>
                            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Examples Section */}
        <section className="py-32 bg-gradient-to-br from-gray-50 to-green-50/30 dark:from-gray-900 dark:to-green-950/20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 animate-fade-in-up">
              <span className="inline-block px-6 py-2 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-300 font-bold text-sm mb-6 border-2 border-green-300 dark:border-green-700">
                PRICING EXAMPLES
              </span>
              <h2 className="text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white">
                <span className="block">See How Much</span>
                <span className="block bg-gradient-to-r from-green-600 via-emerald-500 to-teal-500 bg-clip-text text-transparent mt-2">You'll Pay</span>
              </h2>
              <p className="mt-6 max-w-3xl text-lg text-gray-600 dark:text-gray-300 mx-auto leading-relaxed">
                Calculate your costs based on your student count
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Example 1 */}
              <Card className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-400 transition-all duration-300 hover:shadow-xl rounded-3xl animate-scale-in">
                <CardContent className="pt-8 pb-8 px-6">
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white mb-4">
                      <Users className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      Small School
                    </h3>
                    <p className="text-green-600 dark:text-green-400 text-lg font-bold">
                      50 Students
                    </p>
                  </div>
                  <div className="space-y-3 border-t-2 border-gray-200 dark:border-gray-700 pt-6">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Setup Fee (Basic):</span>
                      <span className="font-bold text-gray-900 dark:text-white">GHS 300</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Monthly (50 × 20):</span>
                      <span className="font-bold text-gray-900 dark:text-white">GHS 1,000</span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t-2 border-green-200 dark:border-green-900">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">First Month Total:</span>
                      <span className="font-extrabold text-2xl text-green-600 dark:text-green-400">GHS 1,300</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic text-center pt-2">
                      Then GHS 1,000/month
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Example 2 */}
              <Card className="bg-white dark:bg-gray-800 border-2 border-green-500 dark:border-green-400 shadow-xl shadow-green-500/20 transition-all duration-300 hover:shadow-2xl rounded-3xl animate-scale-in scale-105" style={{ animationDelay: '100ms' }}>
                <CardContent className="pt-8 pb-8 px-6">
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="inline-block px-4 py-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs font-bold rounded-full">
                      POPULAR SIZE
                    </span>
                  </div>
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 text-white mb-4">
                      <Users className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      Medium School
                    </h3>
                    <p className="text-green-600 dark:text-green-400 text-lg font-bold">
                      150 Students
                    </p>
                  </div>
                  <div className="space-y-3 border-t-2 border-gray-200 dark:border-gray-700 pt-6">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Setup Fee (Basic):</span>
                      <span className="font-bold text-gray-900 dark:text-white">GHS 300</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Monthly (150 × 20):</span>
                      <span className="font-bold text-gray-900 dark:text-white">GHS 3,000</span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t-2 border-green-200 dark:border-green-900">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">First Month Total:</span>
                      <span className="font-extrabold text-2xl text-green-600 dark:text-green-400">GHS 3,300</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic text-center pt-2">
                      Then GHS 3,000/month
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Example 3 */}
              <Card className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-400 transition-all duration-300 hover:shadow-xl rounded-3xl animate-scale-in" style={{ animationDelay: '200ms' }}>
                <CardContent className="pt-8 pb-8 px-6">
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white mb-4">
                      <Users className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      Large School
                    </h3>
                    <p className="text-green-600 dark:text-green-400 text-lg font-bold">
                      300 Students
                    </p>
                  </div>
                  <div className="space-y-3 border-t-2 border-gray-200 dark:border-gray-700 pt-6">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Setup Fee (Standard):</span>
                      <span className="font-bold text-gray-900 dark:text-white">GHS 500</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Monthly (300 × 20):</span>
                      <span className="font-bold text-gray-900 dark:text-white">GHS 6,000</span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t-2 border-green-200 dark:border-green-900">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">First Month Total:</span>
                      <span className="font-extrabold text-2xl text-green-600 dark:text-green-400">GHS 6,500</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic text-center pt-2">
                      Then GHS 6,000/month
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-12 text-center">
              <div className="inline-block px-8 py-4 bg-green-100 dark:bg-green-900/30 rounded-2xl border-2 border-green-300 dark:border-green-700">
                <p className="text-green-800 dark:text-green-200 font-bold mb-2">
                  💡 Pro Tip: Monthly billing adjusts automatically
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  You only pay for active students each month - no long-term commitments required!
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-32 bg-white dark:bg-gray-900">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20 animate-fade-in-up">
              <span className="inline-block px-6 py-2 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-300 font-bold text-sm mb-6 border-2 border-green-300 dark:border-green-700">
                GOT QUESTIONS?
              </span>
              <h2 className="text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white">
                <span className="block">Frequently Asked</span>
                <span className="block bg-gradient-to-r from-green-600 via-emerald-500 to-teal-500 bg-clip-text text-transparent mt-2">Questions</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {faqs.map((faq, index) => (
                <Card 
                  key={index} 
                  className="bg-gradient-to-br from-gray-50 to-green-50/20 dark:from-gray-800 dark:to-green-950/10 border-2 border-gray-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-400 transition-all duration-300 hover:shadow-xl rounded-3xl animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardContent className="pt-6 pb-6 px-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                      {faq.question}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                      {faq.answer}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-16 text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg">
                Still have questions? We're here to help!
              </p>
              <Link href="/#demo">
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold px-10 py-7 text-lg rounded-2xl shadow-lg hover:shadow-2xl transform transition-all duration-300 hover:scale-105"
                >
                  Contact Sales →
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 dark:from-green-800 dark:via-emerald-800 dark:to-teal-800 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full">
              <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl animate-float"></div>
              <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }}></div>
            </div>
          </div>

          <div className="container mx-auto py-24 px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h2 className="text-5xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-green-50 mb-10 max-w-2xl mx-auto leading-relaxed">
              Join thousands of schools already using Syntra. Start your 30-day free trial today. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-5 justify-center">
              <Link href="/login">
                <Button 
                  size="lg"
                  className="bg-white text-green-700 hover:bg-green-50 font-bold px-12 py-7 text-lg rounded-2xl shadow-lg hover:shadow-2xl transform transition-all duration-300 hover:scale-105"
                >
                  Start Free Trial →
                </Button>
              </Link>
              <Link href="/#demo">
                <Button 
                  size="lg"
                  variant="outline"
                  className="bg-transparent border-2 border-white text-white hover:bg-white/10 font-bold px-12 py-7 text-lg rounded-2xl transform transition-all duration-300 hover:scale-105"
                >
                  Schedule Demo
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-green-200 dark:border-green-900 py-16 bg-gradient-to-br from-white to-green-50/30 dark:from-gray-900 dark:to-green-950/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 md:grid-cols-4">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Syntra</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-xs">
                Modern school management platform for the digital age. Empowering educators worldwide.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">Product</h3>
              <ul className="space-y-3 text-sm">
                <li><Link href="/#features" className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors font-medium">Features</Link></li>
                <li><Link href="/pricing" className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors font-medium">Pricing</Link></li>
                <li><Link href="/#demo" className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors font-medium">Demo</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">Company</h3>
              <ul className="space-y-3 text-sm">
                <li><Link href="/about" className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors font-medium">About</Link></li>
                <li><Link href="/contact" className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors font-medium">Contact</Link></li>
                <li><Link href="/about" className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors font-medium">Careers</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">Legal</h3>
              <ul className="space-y-3 text-sm">
                <li><Link href="/privacy" className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors font-medium">Privacy</Link></li>
                <li><Link href="/terms" className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors font-medium">Terms</Link></li>
                <li><Link href="/security" className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors font-medium">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-16 pt-8 border-t-2 border-green-200 dark:border-green-900">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                &copy; 2025 <span className="text-green-600 dark:text-green-400 font-bold">Syntra</span>. All rights reserved.
              </p>
              <div className="flex gap-6 text-sm">
                <Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors font-medium">Privacy Policy</Link>
                <Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors font-medium">Terms of Service</Link>
                <Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors font-medium">Cookie Policy</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
