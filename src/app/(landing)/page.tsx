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

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && currentUser) {
      router.replace('/dashboard');
    }
  }, [currentUser, loading, router]);

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

      // Initialize Vanta effect with dark mode support
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
          color: shouldBeDark ? 0x8b5cf6 : 0x3b82f6, // purple-500 for dark, blue-500 for light
          backgroundColor: shouldBeDark ? 0x111827 : 0xffffff, // gray-900 for dark, white for light
          points: 10.00,
          maxDistance: 22.00,
          spacing: 18.00
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
        color: newDarkMode ? 0x8b5cf6 : 0x3b82f6,
        backgroundColor: newDarkMode ? 0x111827 : 0xffffff
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
      color: 'bg-blue-500',
    },
    {
      icon: BookOpen,
      title: 'Academic Tracking',
      description: 'Grading system, report cards, transcripts, and progress reports with customizable grading scales.',
      color: 'bg-purple-500',
    },
    {
      icon: Calendar,
      title: 'Scheduling',
      description: 'Automated class scheduling, teacher assignments, and room allocations with conflict detection.',
      color: 'bg-blue-600',
    },
    {
      icon: MessageSquare,
      title: 'Communication',
      description: 'Integrated messaging system for teachers, parents, and students with announcements and alerts.',
      color: 'bg-purple-600',
    },
    {
      icon: DollarSign,
      title: 'Finance',
      description: 'Fee collection, expense tracking, payroll management, and financial reporting tools.',
      color: 'bg-blue-700',
    },
    {
      icon: BarChart2,
      title: 'Analytics',
      description: 'Comprehensive dashboards and reports to visualize school performance and trends.',
      color: 'bg-purple-700',
    },
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Principal, Oakridge High',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      quote: 'CampusConnect has transformed how we manage our school. Attendance tracking, grade management, and parent communication are now seamless.',
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
            <GraduationCap className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              CampusConnect
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-6">
            <a href="#features" onClick={(e) => handleAnchorClick(e, '#features')} className="text-sm font-medium hover:text-blue-600 transition-colors">
              Features
            </a>
            <a href="#demo" onClick={(e) => handleAnchorClick(e, '#demo')} className="text-sm font-medium hover:text-blue-600 transition-colors">
              Demo
            </a>
            <a href="#testimonials" onClick={(e) => handleAnchorClick(e, '#testimonials')} className="text-sm font-medium hover:text-blue-600 transition-colors">
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
            <Link href="/login" className="hidden sm:block">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/login">
              <Button className="bg-blue-600 hover:bg-blue-700">Start Free Trial</Button>
            </Link>
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
                className="text-sm font-medium hover:text-blue-600 transition-colors"
              >
                Features
              </a>
              <a 
                href="#demo" 
                onClick={(e) => { handleAnchorClick(e, '#demo'); setMobileMenuOpen(false); }}
                className="text-sm font-medium hover:text-blue-600 transition-colors"
              >
                Demo
              </a>
              <a 
                href="#testimonials" 
                onClick={(e) => { handleAnchorClick(e, '#testimonials'); setMobileMenuOpen(false); }}
                className="text-sm font-medium hover:text-blue-600 transition-colors"
              >
                Testimonials
              </a>
            </nav>
          </div>
        )}
      </header>

      <main>
        {/* Hero Section */}
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div id="vanta-bg" className="absolute inset-0"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-gray-900">
              <span className="block bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500">
                Modern School Management
              </span>
              <span className="block mt-2 text-2xl md:text-4xl font-medium text-gray-600">
                Streamlined. Efficient. Powerful.
              </span>
            </h1>
            <p className="mt-6 max-w-lg mx-auto text-lg text-gray-600">
              CampusConnect transforms school administration with cloud-based tools for attendance, grading, communication, and more.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/login">
                <Button 
                  size="lg" 
                  className="px-8 py-3 text-base font-medium md:py-4 md:text-lg md:px-10 transition-all duration-300 transform hover:scale-105"
                >
                  Start Free Trial
                </Button>
              </Link>
              <Link href="/login">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="px-8 py-3 text-base font-medium md:py-4 md:text-lg md:px-10 transition-all duration-300 transform hover:scale-105"
                >
                  Explore Features
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-white to-transparent"></div>
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
        <section id="features" className="py-20 bg-white dark:bg-gray-900">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
                <span className="block">Everything Your School Needs</span>
                <span className="block text-blue-600 dark:text-blue-400 mt-2">In One Platform</span>
              </h2>
              <p className="mt-4 max-w-2xl text-xl text-gray-500 dark:text-gray-400 mx-auto">
                Comprehensive tools designed to simplify school administration and enhance learning experiences.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <div key={index} className="group">
                  <Card className="h-full border-2 hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
                    <CardContent className="pt-6">
                      <div className={`flex items-center justify-center h-12 w-12 rounded-md ${feature.color} text-white mb-4`}>
                        <feature.icon className="h-6 w-6" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-base text-gray-500 dark:text-gray-400">
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
        <section id="demo" className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
              <div className="text-white">
                <h2 className="text-3xl font-extrabold sm:text-4xl mb-6">
                  Ready to transform your school?
                </h2>
                <p className="text-lg text-blue-100 mb-8">
                  See how CampusConnect can streamline your school operations with a personalized demo from our team.
                </p>
                <form onSubmit={handleDemoSubmit} className="space-y-4 max-w-lg">
                  <Input 
                    type="text" 
                    placeholder="Your name" 
                    className="bg-white text-gray-900"
                    required
                  />
                  <Input 
                    type="email" 
                    placeholder="School email" 
                    className="bg-white text-gray-900"
                    required
                  />
                  <Input 
                    type="text" 
                    placeholder="School name" 
                    className="bg-white text-gray-900"
                    required
                  />
                  <Button 
                    type="submit" 
                    className="w-full bg-white text-blue-700 hover:bg-gray-50 font-medium py-6 transform transition-transform hover:scale-105"
                    size="lg"
                  >
                    Request Demo
                  </Button>
                </form>
              </div>
              <div className="mt-12 lg:mt-0">
                <div className="relative rounded-lg shadow-2xl overflow-hidden">
                  <div className="aspect-video bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                    <GraduationCap className="h-32 w-32 text-white/30" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-20 bg-gray-50 dark:bg-gray-800">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
                Trusted by Educators Worldwide
              </h2>
              <p className="mt-4 max-w-2xl text-xl text-gray-500 dark:text-gray-400 mx-auto">
                Hear what school administrators and teachers have to say about CampusConnect.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="bg-white dark:bg-gray-900 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                  <CardContent className="pt-6">
                    <div className="flex items-center mb-4">
                      <img 
                        className="h-12 w-12 rounded-full" 
                        src={testimonial.image} 
                        alt={testimonial.name}
                      />
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {testimonial.name}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                          {testimonial.role}
                        </p>
                      </div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
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
        <section className="bg-white dark:bg-gray-900">
          <div className="container mx-auto py-16 px-4 sm:px-6 lg:px-8 lg:flex lg:items-center lg:justify-between">
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              <span className="block">Ready to modernize your school?</span>
              <span className="block text-blue-600 dark:text-blue-400">Get started with CampusConnect today.</span>
            </h2>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 lg:mt-0">
              <Link href="/login">
                <Button 
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 transform transition-transform hover:scale-105"
                >
                  Start Free Trial
                </Button>
              </Link>
              <Link href="/login">
                <Button 
                  size="lg"
                  variant="outline"
                  className="transform transition-transform hover:scale-105"
                >
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-6 w-6 text-blue-600" />
                <span className="font-bold">CampusConnect</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Modern school management platform for the digital age.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold">Product</h3>
              <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                <li><a href="#features" onClick={(e) => handleAnchorClick(e, '#features')} className="hover:text-blue-600 transition-colors">Features</a></li>
                <li><a href="#demo" onClick={(e) => handleAnchorClick(e, '#demo')} className="hover:text-blue-600 transition-colors">Demo</a></li>
                <li><Link href="/signup" className="hover:text-blue-600 transition-colors">Pricing</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold">Company</h3>
              <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                <li><Link href="#" className="hover:text-blue-600 transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-blue-600 transition-colors">Contact</Link></li>
                <li><Link href="#" className="hover:text-blue-600 transition-colors">Careers</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold">Legal</h3>
              <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                <li><Link href="#" className="hover:text-blue-600 transition-colors">Privacy</Link></li>
                <li><Link href="#" className="hover:text-blue-600 transition-colors">Terms</Link></li>
                <li><Link href="#" className="hover:text-blue-600 transition-colors">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t text-center text-sm text-gray-500 dark:text-gray-400">
            <p>&copy; 2025 CampusConnect. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
