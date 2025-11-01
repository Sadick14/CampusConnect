'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  GraduationCap, 
  Menu,
  X,
  Target,
  Heart,
  Users,
  TrendingUp,
  Award,
  Globe
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';

export default function AboutPage() {
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

  const values = [
    {
      icon: Target,
      title: 'Innovation',
      description: 'We constantly push boundaries to deliver cutting-edge solutions that transform education management.'
    },
    {
      icon: Heart,
      title: 'Empathy',
      description: 'We understand the challenges educators face and design solutions with their needs at heart.'
    },
    {
      icon: Users,
      title: 'Collaboration',
      description: 'We believe in working together with schools to create solutions that truly make a difference.'
    },
    {
      icon: TrendingUp,
      title: 'Excellence',
      description: 'We strive for excellence in everything we do, from code quality to customer support.'
    }
  ];

  const stats = [
    { number: '500+', label: 'Schools Worldwide' },
    { number: '100K+', label: 'Active Students' },
    { number: '5K+', label: 'Teachers' },
    { number: '99.9%', label: 'Uptime' }
  ];

  const team = [
    {
      name: 'Dr. Sarah Johnson',
      role: 'Chief Executive Officer',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      bio: '15+ years in EdTech innovation'
    },
    {
      name: 'Michael Chen',
      role: 'Chief Technology Officer',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
      bio: 'Former Google engineer, MIT graduate'
    },
    {
      name: 'Amina Osei',
      role: 'Head of Product',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amina',
      bio: 'Product strategy expert, ex-Microsoft'
    },
    {
      name: 'David Martinez',
      role: 'Head of Customer Success',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
      bio: 'Passionate about educator success'
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
          
          <nav className="hidden md:flex gap-6">
            <Link href="/#features" className="text-sm font-medium hover:text-green-600 transition-colors">
              Features
            </Link>
            <Link href="/pricing" className="text-sm font-medium hover:text-green-600 transition-colors">
              Pricing
            </Link>
            <Link href="/about" className="text-sm font-medium text-green-600">
              About
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
        
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-white dark:bg-gray-900 p-4">
            <nav className="flex flex-col gap-4">
              <Link href="/#features" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium hover:text-green-600 transition-colors">
                Features
              </Link>
              <Link href="/pricing" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium hover:text-green-600 transition-colors">
                Pricing
              </Link>
              <Link href="/about" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-green-600">
                About
              </Link>
            </nav>
          </div>
        )}
      </header>

      <main>
        {/* Hero Section */}
        <section className="py-24 bg-gradient-to-br from-green-50 via-emerald-50/50 to-teal-50/30 dark:from-gray-900 dark:via-green-950/20 dark:to-gray-900 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20">
            <div className="absolute top-20 right-20 w-72 h-72 bg-green-400 rounded-full blur-3xl animate-float"></div>
            <div className="absolute bottom-20 left-20 w-96 h-96 bg-emerald-400 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-4xl mx-auto animate-fade-in-up">
              <span className="inline-block px-6 py-2 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-300 font-bold text-sm mb-6 border-2 border-green-300 dark:border-green-700">
                OUR STORY
              </span>
              <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 dark:text-white mb-6">
                <span className="block">Transforming Education</span>
                <span className="block bg-gradient-to-r from-green-600 via-emerald-500 to-teal-500 bg-clip-text text-transparent mt-2">One School at a Time</span>
              </h1>
              <p className="mt-6 text-xl text-gray-600 dark:text-gray-300 leading-relaxed max-w-3xl mx-auto">
                We're on a mission to empower educators and institutions with modern tools that simplify school management and enhance learning experiences for everyone.
              </p>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 bg-white dark:bg-gray-900">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div 
                  key={index} 
                  className="text-center animate-scale-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                    {stat.number}
                  </div>
                  <div className="text-sm md:text-base text-gray-600 dark:text-gray-400 font-medium">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-32 bg-gradient-to-br from-gray-50 to-green-50/30 dark:from-gray-900 dark:to-green-950/20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div className="animate-fade-in-up">
                <span className="inline-block px-6 py-2 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-300 font-bold text-sm mb-6 border-2 border-green-300 dark:border-green-700">
                  OUR MISSION
                </span>
                <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-6">
                  Making School Management
                  <span className="block bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mt-2">
                    Simple & Effective
                  </span>
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                  We believe that school administrators and teachers should spend less time on paperwork and more time on what truly matters: educating and inspiring students.
                </p>
                <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                  That's why we built Syntra - a comprehensive, user-friendly platform that streamlines every aspect of school management, from student records to fee collection, attendance tracking to grade management.
                </p>
              </div>
              <div className="relative animate-slide-in-right">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                  <div className="aspect-square bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500 flex items-center justify-center">
                    <Globe className="h-48 w-48 text-white/20" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-32 bg-white dark:bg-gray-900">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20 animate-fade-in-up">
              <span className="inline-block px-6 py-2 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-300 font-bold text-sm mb-6 border-2 border-green-300 dark:border-green-700">
                OUR VALUES
              </span>
              <h2 className="text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white">
                <span className="block">What Drives Us</span>
                <span className="block bg-gradient-to-r from-green-600 via-emerald-500 to-teal-500 bg-clip-text text-transparent mt-2">Every Day</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {values.map((value, index) => (
                <Card 
                  key={index}
                  className="bg-gradient-to-br from-white to-green-50/30 dark:from-gray-800 dark:to-green-950/20 border-2 border-gray-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-400 transition-all duration-300 hover:shadow-xl rounded-3xl animate-scale-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardContent className="pt-8 pb-8 px-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                          <value.icon className="h-7 w-7 text-white" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                          {value.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                          {value.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-32 bg-gradient-to-br from-gray-50 to-green-50/30 dark:from-gray-900 dark:to-green-950/20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20 animate-fade-in-up">
              <span className="inline-block px-6 py-2 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-300 font-bold text-sm mb-6 border-2 border-green-300 dark:border-green-700">
                MEET THE TEAM
              </span>
              <h2 className="text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white">
                <span className="block">The People Behind</span>
                <span className="block bg-gradient-to-r from-green-600 via-emerald-500 to-teal-500 bg-clip-text text-transparent mt-2">Syntra</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {team.map((member, index) => (
                <Card 
                  key={index}
                  className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-400 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 rounded-3xl animate-scale-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardContent className="pt-8 pb-8 px-6 text-center">
                    <div className="relative mb-6 flex justify-center">
                      <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full blur-lg opacity-30"></div>
                      <img 
                        src={member.image} 
                        alt={member.name}
                        className="relative h-24 w-24 rounded-full border-4 border-green-500"
                      />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                      {member.name}
                    </h3>
                    <p className="text-sm text-green-600 dark:text-green-400 font-semibold mb-3">
                      {member.role}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {member.bio}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 dark:from-green-800 dark:via-emerald-800 dark:to-teal-800 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl animate-float"></div>
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }}></div>
          </div>

          <div className="container mx-auto py-24 px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h2 className="text-5xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
              Ready to Join Us?
            </h2>
            <p className="text-xl text-green-50 mb-10 max-w-2xl mx-auto leading-relaxed">
              Start your 30-day free trial today and see why thousands of schools trust Syntra.
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
              <Link href="/contact">
                <Button 
                  size="lg"
                  variant="outline"
                  className="bg-transparent border-2 border-white text-white hover:bg-white/10 font-bold px-12 py-7 text-lg rounded-2xl transform transition-all duration-300 hover:scale-105"
                >
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-green-200 dark:border-green-900 py-16 bg-gradient-to-br from-white to-green-50/30 dark:from-gray-900 dark:to-green-950/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Link href="/" className="inline-flex items-center gap-3 mb-4">
              <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white">
                <GraduationCap className="h-6 w-6" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Syntra</span>
            </Link>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">
              &copy; 2025 <span className="text-green-600 dark:text-green-400 font-bold">Syntra</span>. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
