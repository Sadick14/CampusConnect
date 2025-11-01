'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  GraduationCap, 
  Users, 
  BookOpen, 
  Calendar, 
  MessageSquare, 
  DollarSign,
  BarChart2,
  Star,
  Menu,
  X,
  ArrowRight
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  // Note: Removed auto-redirect to allow logged-in users to view homepage
  // Users can still access dashboard via navigation menu

  // Initialize Vanta.js background effect
  useEffect(() => {
    // Check for saved dark mode preference
    const savedDarkMode = localStorage.getItem('darkMode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedDarkMode === 'true' || (!savedDarkMode && prefersDark);
    
    setDarkMode(shouldBeDark);
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    }

    let vantaEffect: any = null;

    const loadVanta = async () => {
      // Load Three.js
      const script1 = document.createElement('script');
      script1.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js';
      script1.async = true;
      document.head.appendChild(script1);

      await new Promise((resolve) => {
        script1.onload = resolve;
      });

      // Load Vanta.NET
      const script2 = document.createElement('script');
      script2.src = 'https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.net.min.js';
      script2.async = true;
      document.head.appendChild(script2);

      await new Promise((resolve) => {
        script2.onload = resolve;
      });

      // Initialize Vanta effect with dark mode support and enhanced settings
      if ((window as any).VANTA) {
        vantaEffect = (window as any).VANTA.NET({
          el: '#vanta-bg',
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.00,
          minWidth: 200.00,
          scale: 1.00,
          scaleMobile: 1.00,
          color: shouldBeDark ? 0x10b981 : 0x22c55e, // emerald-500 for dark, green-500 for light
          backgroundColor: shouldBeDark ? 0x0f172a : 0xffffff, // slate-900 for dark, white for light
          points: 15.00, // Increased points for richer effect
          maxDistance: 25.00, // Increased connection distance
          spacing: 16.00, // Tighter spacing for more connections
          showDots: true,
          backgroundAlpha: shouldBeDark ? 0.9 : 0.5
        });
        // Store reference for dark mode updates
        (window as any).vantaEffect = vantaEffect;
      }
    };

    loadVanta();

    return () => {
      if (vantaEffect) vantaEffect.destroy();
    };
  }, []);

  // Handle dark mode toggle
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    localStorage.setItem('darkMode', newDarkMode.toString());
    
    // Update Vanta effect colors
    if ((window as any).vantaEffect) {
      (window as any).vantaEffect.setOptions({
        color: newDarkMode ? 0x10b981 : 0x22c55e,
        backgroundColor: newDarkMode ? 0x0f172a : 0xffffff,
        backgroundAlpha: newDarkMode ? 0.9 : 0.5
      });
    }
  };

  // Handle demo form submission
  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Demo request submitted! We will contact you shortly.');
    (e.target as HTMLFormElement).reset();
  };

  // Handle smooth scrolling for anchor links
  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth'
      });
    }
  };

  const features = [
    {
      icon: Users,
      title: 'Student Management',
      description: 'Complete student profiles, attendance tracking, behavior recording, and health information all in one place.',
      color: 'bg-green-500',
    },
    {
      icon: BookOpen,
      title: 'Academic Tracking',
      description: 'Grading system, report cards, transcripts, and progress reports with customizable grading scales.',
      color: 'bg-emerald-500',
    },
    {
      icon: Calendar,
      title: 'Scheduling',
      description: 'Automated class scheduling, teacher assignments, and room allocations with conflict detection.',
      color: 'bg-green-600',
    },
    {
      icon: MessageSquare,
      title: 'Communication',
      description: 'Integrated messaging system for teachers, parents, and students with announcements and alerts.',
      color: 'bg-emerald-600',
    },
    {
      icon: DollarSign,
      title: 'Finance',
      description: 'Fee collection, expense tracking, payroll management, and financial reporting tools.',
      color: 'bg-teal-600',
    },
    {
      icon: BarChart2,
      title: 'Analytics',
      description: 'Comprehensive dashboards and reports to visualize school performance and trends.',
      color: 'bg-green-700',
    },
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Principal, Oakridge High',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      quote: 'Syntra has transformed how we manage our school. Attendance tracking, grade management, and parent communication are now seamless.',
    },
    {
      name: 'Michael Chen',
      role: 'IT Director, Springfield Academy',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
      quote: 'The implementation was smooth and the support team is exceptional. Our teachers love the intuitive interface and powerful features.',
    },
    {
      name: 'Emily Rodriguez',
      role: 'Math Teacher, Lincoln Prep',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
      quote: 'Grading has never been easier. The analytics help me identify students who need extra help, and the parent portal keeps everyone informed.',
    },
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
            <a href="#features" onClick={(e) => handleAnchorClick(e, '#features')} className="text-sm font-medium hover:text-green-600 transition-colors">
              Features
            </a>
            <Link href="/pricing" className="text-sm font-medium hover:text-green-600 transition-colors">
              Pricing
            </Link>
            <a href="#demo" onClick={(e) => handleAnchorClick(e, '#demo')} className="text-sm font-medium hover:text-green-600 transition-colors">
              Demo
            </a>
            <a href="#testimonials" onClick={(e) => handleAnchorClick(e, '#testimonials')} className="text-sm font-medium hover:text-green-600 transition-colors">
              Testimonials
            </a>
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
              <a 
                href="#features" 
                onClick={(e) => { handleAnchorClick(e, '#features'); setMobileMenuOpen(false); }}
                className="text-sm font-medium hover:text-green-600 transition-colors"
              >
                Features
              </a>
              <Link 
                href="/pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium hover:text-green-600 transition-colors"
              >
                Pricing
              </Link>
              <a 
                href="#demo" 
                onClick={(e) => { handleAnchorClick(e, '#demo'); setMobileMenuOpen(false); }}
                className="text-sm font-medium hover:text-green-600 transition-colors"
              >
                Demo
              </a>
              <a 
                href="#testimonials" 
                onClick={(e) => { handleAnchorClick(e, '#testimonials'); setMobileMenuOpen(false); }}
                className="text-sm font-medium hover:text-green-600 transition-colors"
              >
                Testimonials
              </a>
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
        {/* Hero Section - Full Screen */}
        <section className="relative h-screen overflow-hidden">
          <div id="vanta-bg" className="absolute inset-0 z-0"></div>
          
          {/* Gradient overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-white/90 dark:to-gray-900/90 z-10"></div>
          
          <div className="relative z-20 h-full flex items-center justify-center">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
              <div className="text-center">
                {/* Animated badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100/90 dark:bg-green-900/50 backdrop-blur-sm border border-green-200 dark:border-green-800 mb-8 animate-fade-in-up">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                  <span className="text-sm font-semibold text-green-800 dark:text-green-200">
                    14-Day Free Trial • No Credit Card Required
                  </span>
                </div>

                <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                  <span className="block bg-clip-text text-transparent bg-gradient-to-r from-green-600 via-emerald-500 to-teal-600 dark:from-green-400 dark:via-emerald-300 dark:to-teal-400 drop-shadow-lg">
                    Transform Your
                  </span>
                  <span className="block mt-2 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200">
                    School Management
                  </span>
                </h1>
                
                <p className="mt-8 max-w-2xl mx-auto text-xl md:text-2xl text-gray-700 dark:text-gray-200 leading-relaxed font-medium animate-fade-in-up backdrop-blur-sm" style={{ animationDelay: '200ms' }}>
                  Syntra brings together <span className="text-green-600 dark:text-green-400 font-bold">attendance</span>, <span className="text-emerald-600 dark:text-emerald-400 font-bold">grading</span>, and <span className="text-teal-600 dark:text-teal-400 font-bold">communication</span> in one powerful platform.
                </p>

                {/* Key stats */}
                <div className="mt-12 grid grid-cols-3 gap-8 max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                  <div className="backdrop-blur-md bg-white/80 dark:bg-gray-800/80 rounded-2xl p-6 shadow-xl border border-green-100 dark:border-green-900">
                    <div className="text-4xl font-bold text-green-600 dark:text-green-400">500+</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300 mt-2">Schools Worldwide</div>
                  </div>
                  <div className="backdrop-blur-md bg-white/80 dark:bg-gray-800/80 rounded-2xl p-6 shadow-xl border border-emerald-100 dark:border-emerald-900">
                    <div className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">100K+</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300 mt-2">Active Students</div>
                  </div>
                  <div className="backdrop-blur-md bg-white/80 dark:bg-gray-800/80 rounded-2xl p-6 shadow-xl border border-teal-100 dark:border-teal-900">
                    <div className="text-4xl font-bold text-teal-600 dark:text-teal-400">99.9%</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300 mt-2">Uptime</div>
                  </div>
                </div>

                <div className="mt-12 flex flex-col sm:flex-row justify-center gap-6 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                  <Link href="/login">
                    <Button 
                      size="lg" 
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-2xl shadow-green-500/50 px-10 py-7 text-lg font-bold rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-green-500/60"
                    >
                      <span className="mr-3">Start Free Trial</span>
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="#demo">
                    <Button 
                      size="lg" 
                      variant="outline"
                      className="backdrop-blur-md bg-white/90 dark:bg-gray-800/90 border-2 border-green-600 dark:border-green-500 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/30 px-10 py-7 text-lg font-bold rounded-2xl transition-all duration-300 transform hover:scale-105"
                    >
                      Watch Demo
                    </Button>
                  </Link>
                </div>

                {/* Trusted by badge */}
                <div className="mt-16 flex items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '500ms' }}>
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div 
                        key={i}
                        className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-800 bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white font-bold"
                      >
                        {String.fromCharCode(64 + i)}
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                    Trusted by educators worldwide
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 animate-bounce">
            <div className="w-6 h-10 rounded-full border-2 border-green-600 dark:border-green-400 flex justify-center p-2">
              <div className="w-1 h-3 bg-green-600 dark:bg-green-400 rounded-full animate-pulse"></div>
            </div>
          </div>
        </section>        {/* Logos Section */}
        <section className="bg-gray-50 dark:bg-gray-800 py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm font-semibold uppercase text-gray-500 dark:text-gray-400 tracking-wide">
              Trusted by schools worldwide
            </p>
            <div className="mt-6 flex flex-wrap justify-center items-center gap-8">
              {[1, 2, 3, 4, 5].map((i) => (
                <div 
                  key={i} 
                  className="h-12 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg opacity-70 hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <GraduationCap className="h-8 w-8 text-gray-400" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-32 bg-gradient-to-br from-gray-50 to-green-50/30 dark:from-gray-900 dark:to-green-950/20 relative overflow-hidden">
          {/* Background decorations */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20">
            <div className="absolute top-20 right-20 w-72 h-72 bg-green-400 rounded-full blur-3xl animate-float"></div>
            <div className="absolute bottom-20 left-20 w-96 h-96 bg-emerald-400 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-20 animate-fade-in-up">
              <span className="inline-block px-6 py-2 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-300 font-bold text-sm mb-6 border-2 border-green-300 dark:border-green-700">
                POWERFUL FEATURES
              </span>
              <h2 className="text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white">
                <span className="block">Everything Your School</span>
                <span className="block bg-gradient-to-r from-green-600 via-emerald-500 to-teal-500 bg-clip-text text-transparent mt-2">Needs in One Platform</span>
              </h2>
              <p className="mt-6 max-w-3xl text-xl text-gray-600 dark:text-gray-300 mx-auto leading-relaxed">
                Comprehensive tools designed to simplify school administration and enhance learning experiences for everyone.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <div 
                  key={index} 
                  className="group animate-scale-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <Card className="h-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-2 border-gray-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-400 transition-all duration-500 hover:shadow-2xl hover:shadow-green-500/20 hover:-translate-y-3 rounded-3xl overflow-hidden">
                    <CardContent className="pt-8 pb-8 px-6">
                      <div className="relative mb-6">
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity"></div>
                        <div className={`relative flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                          <feature.icon className="h-8 w-8" />
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Demo Section */}
        <section id="demo" className="py-32 bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 dark:from-green-800 dark:via-emerald-800 dark:to-teal-800 relative overflow-hidden">
          {/* Animated background patterns */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full">
              <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl animate-float"></div>
              <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }}></div>
            </div>
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
              <div className="text-white animate-fade-in-up">
                <span className="inline-block px-6 py-2 rounded-full bg-white/20 backdrop-blur-md text-white font-bold text-sm mb-6 border-2 border-white/30">
                  GET STARTED TODAY
                </span>
                <h2 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight">
                  Ready to Transform Your School?
                </h2>
                <p className="text-xl text-green-50 mb-10 leading-relaxed max-w-xl">
                  See how Syntra can streamline your school operations with a personalized demo from our team. Join thousands of satisfied educators.
                </p>
                <form onSubmit={handleDemoSubmit} className="space-y-5 max-w-lg">
                  <Input 
                    type="text" 
                    placeholder="Your name" 
                    className="bg-white/95 dark:bg-white/90 backdrop-blur-md text-gray-900 border-2 border-white/50 focus:border-white rounded-2xl h-14 text-lg font-medium"
                    required
                  />
                  <Input 
                    type="email" 
                    placeholder="School email" 
                    className="bg-white/95 dark:bg-white/90 backdrop-blur-md text-gray-900 border-2 border-white/50 focus:border-white rounded-2xl h-14 text-lg font-medium"
                    required
                  />
                  <Input 
                    type="text" 
                    placeholder="School name" 
                    className="bg-white/95 dark:bg-white/90 backdrop-blur-md text-gray-900 border-2 border-white/50 focus:border-white rounded-2xl h-14 text-lg font-medium"
                    required
                  />
                  <Button 
                    type="submit" 
                    className="w-full bg-white text-green-700 hover:bg-green-50 font-bold py-7 text-lg rounded-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-2xl shadow-lg"
                    size="lg"
                  >
                    Request Demo Now →
                  </Button>
                </form>
              </div>
              <div className="mt-16 lg:mt-0 animate-slide-in-right">
                <div className="relative rounded-3xl shadow-2xl overflow-hidden border-4 border-white/20 backdrop-blur-sm">
                  <div className="aspect-video bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500 flex items-center justify-center relative">
                    {/* Decorative elements */}
                    <div className="absolute inset-0 bg-grid-white/10"></div>
                    <GraduationCap className="h-40 w-40 text-white/20 relative z-10" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-32 bg-white dark:bg-gray-900 relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-green-500 to-emerald-500"></div>
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-20 animate-fade-in-up">
              <span className="inline-block px-6 py-2 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-300 font-bold text-sm mb-6 border-2 border-green-300 dark:border-green-700">
                SUCCESS STORIES
              </span>
              <h2 className="text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white">
                Trusted by Educators
                <span className="block bg-gradient-to-r from-green-600 via-emerald-500 to-teal-500 bg-clip-text text-transparent mt-2">Worldwide</span>
              </h2>
              <p className="mt-6 max-w-3xl text-xl text-gray-600 dark:text-gray-300 mx-auto leading-relaxed">
                Hear what school administrators and teachers have to say about Syntra.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {testimonials.map((testimonial, index) => (
                <Card 
                  key={index} 
                  className="bg-gradient-to-br from-white to-green-50/30 dark:from-gray-800 dark:to-green-950/20 border-2 border-gray-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-400 hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 rounded-3xl animate-scale-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardContent className="pt-8 pb-8 px-6">
                    <div className="flex items-center mb-6">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full blur-md opacity-30"></div>
                        <img 
                          className="relative h-14 w-14 rounded-full border-2 border-green-500" 
                          src={testimonial.image} 
                          alt={testimonial.name}
                        />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          {testimonial.name}
                        </h3>
                        <p className="text-green-600 dark:text-green-400 text-sm font-medium">
                          {testimonial.role}
                        </p>
                      </div>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed italic">
                      &quot;{testimonial.quote}&quot;
                    </p>
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-current" />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-br from-gray-50 to-green-50/50 dark:from-gray-900 dark:to-green-950/30 relative overflow-hidden">
          {/* Background decorations */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute top-10 right-10 w-72 h-72 bg-green-500 rounded-full blur-3xl animate-float"></div>
            <div className="absolute bottom-10 left-10 w-96 h-96 bg-emerald-500 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
          </div>

          <div className="container mx-auto py-24 px-4 sm:px-6 lg:px-8 lg:flex lg:items-center lg:justify-between relative z-10">
            <div className="animate-fade-in-up">
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                <span className="block">Ready to Modernize</span>
                <span className="block bg-gradient-to-r from-green-600 via-emerald-500 to-teal-500 bg-clip-text text-transparent mt-2">Your School?</span>
              </h2>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
                Get started with Syntra today and transform your educational institution.
              </p>
            </div>
            <div className="mt-10 flex flex-col sm:flex-row gap-5 lg:mt-0 animate-slide-in-right">
              <Link href="/login">
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold px-10 py-7 text-lg rounded-2xl shadow-lg hover:shadow-2xl transform transition-all duration-300 hover:scale-105"
                >
                  Start Free Trial →
                </Button>
              </Link>
              <Link href="/login">
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-2 border-green-600 dark:border-green-500 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/30 font-bold px-10 py-7 text-lg rounded-2xl transform transition-all duration-300 hover:scale-105"
                >
                  Sign In
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
              <div className="flex gap-3">
                {/* Social icons */}
                <a href="#" className="h-10 w-10 rounded-xl bg-gray-200 dark:bg-gray-800 hover:bg-green-500 dark:hover:bg-green-600 transition-colors flex items-center justify-center group">
                  <svg className="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="#" className="h-10 w-10 rounded-xl bg-gray-200 dark:bg-gray-800 hover:bg-green-500 dark:hover:bg-green-600 transition-colors flex items-center justify-center group">
                  <svg className="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                </a>
                <a href="#" className="h-10 w-10 rounded-xl bg-gray-200 dark:bg-gray-800 hover:bg-green-500 dark:hover:bg-green-600 transition-colors flex items-center justify-center group">
                  <svg className="h-5 w-5 text-gray-600 dark:text-gray-400 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">Product</h3>
              <ul className="space-y-3 text-sm">
                <li><a href="#features" onClick={(e) => handleAnchorClick(e, '#features')} className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors font-medium">Features</a></li>
                <li><Link href="/pricing" className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors font-medium">Pricing</Link></li>
                <li><a href="#demo" onClick={(e) => handleAnchorClick(e, '#demo')} className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors font-medium">Demo</a></li>
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
                <Link href="/privacy" className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors font-medium">Privacy Policy</Link>
                <Link href="/terms" className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors font-medium">Terms of Service</Link>
                <Link href="/security" className="text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors font-medium">Security</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
