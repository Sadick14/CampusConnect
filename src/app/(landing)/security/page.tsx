'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { GraduationCap, Menu, X, Shield, Lock, Key, Eye, Server, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';

export default function SecurityPage() {
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

  const securityFeatures = [
    {
      icon: Lock,
      title: 'Data Encryption',
      description: 'All data is encrypted in transit using TLS 1.3 and at rest using AES-256 encryption.'
    },
    {
      icon: Key,
      title: 'Secure Authentication',
      description: 'Multi-factor authentication and secure password requirements protect your account.'
    },
    {
      icon: Eye,
      title: 'Privacy Protection',
      description: 'We never sell your data and comply with international privacy standards.'
    },
    {
      icon: Server,
      title: 'Secure Infrastructure',
      description: 'Hosted on enterprise-grade servers with 99.9% uptime and automatic backups.'
    },
    {
      icon: Shield,
      title: 'Regular Audits',
      description: 'Continuous security monitoring and regular third-party security audits.'
    },
    {
      icon: AlertTriangle,
      title: 'Incident Response',
      description: '24/7 monitoring with rapid incident response team for immediate threat mitigation.'
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 dark:bg-gray-900/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-green-600" />
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600">
              Syntra
            </span>
          </Link>
          
          <div className="flex gap-4 items-center">
            <button onClick={toggleDarkMode} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
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
              <Link href="/login">
                <Button className="bg-green-600 hover:bg-green-700">Start Free Trial</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="py-24 bg-gradient-to-br from-green-50 via-emerald-50/50 to-teal-50/30 dark:from-gray-900 dark:via-green-950/20 dark:to-gray-900">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-gradient-to-br from-green-500 to-emerald-600 text-white mb-8 shadow-lg">
                <Shield className="h-10 w-10" />
              </div>
              <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 dark:text-white mb-6">
                <span className="block">Security You Can</span>
                <span className="block bg-gradient-to-r from-green-600 via-emerald-500 to-teal-500 bg-clip-text text-transparent mt-2">Trust</span>
              </h1>
              <p className="mt-6 text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                Your data security and privacy are our top priorities. We implement industry-leading security measures to protect your school's sensitive information.
              </p>
            </div>
          </div>
        </section>

        {/* Security Features */}
        <section className="py-32 bg-white dark:bg-gray-900">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">
                Enterprise-Grade Security
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
                We use multiple layers of security to ensure your data is always protected
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {securityFeatures.map((feature, index) => (
                <Card
                  key={index}
                  className="bg-gradient-to-br from-white to-green-50/30 dark:from-gray-800 dark:to-green-950/20 border-2 border-gray-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-400 transition-all duration-300 hover:shadow-xl rounded-3xl"
                >
                  <CardContent className="pt-8 pb-8 px-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                          <feature.icon className="h-7 w-7 text-white" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                          {feature.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Compliance Section */}
        <section className="py-32 bg-gradient-to-br from-gray-50 to-green-50/30 dark:from-gray-900 dark:to-green-950/20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-8 text-center">
                Compliance & Certifications
              </h2>
              <div className="prose prose-green dark:prose-invert max-w-none space-y-6">
                <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                  Syntra is committed to meeting and exceeding industry security standards and compliance requirements:
                </p>
                <ul className="space-y-4 text-gray-600 dark:text-gray-300">
                  <li className="flex items-start gap-3">
                    <div className="mt-1 flex-shrink-0 h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-green-600 dark:bg-green-400"></div>
                    </div>
                    <span><strong>GDPR Compliant:</strong> We comply with the General Data Protection Regulation for handling personal data</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-1 flex-shrink-0 h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-green-600 dark:bg-green-400"></div>
                    </div>
                    <span><strong>ISO 27001:</strong> Information security management system certification</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-1 flex-shrink-0 h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-green-600 dark:bg-green-400"></div>
                    </div>
                    <span><strong>SOC 2 Type II:</strong> Independent audit of our security controls</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="mt-1 flex-shrink-0 h-6 w-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-green-600 dark:bg-green-400"></div>
                    </div>
                    <span><strong>Student Data Privacy:</strong> We comply with all applicable student data privacy laws and regulations</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Best Practices Section */}
        <section className="py-32 bg-white dark:bg-gray-900">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-12 text-center">
                Security Best Practices
              </h2>
              <div className="space-y-8">
                <Card className="bg-gradient-to-br from-white to-green-50/30 dark:from-gray-800 dark:to-green-950/20 border-2 border-gray-200 dark:border-gray-700 rounded-3xl">
                  <CardContent className="pt-8 pb-8 px-8">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">For Administrators</h3>
                    <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                      <li className="flex items-start gap-3">
                        <span className="text-green-600 dark:text-green-400 mt-1">✓</span>
                        <span>Use strong, unique passwords and enable multi-factor authentication</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-green-600 dark:text-green-400 mt-1">✓</span>
                        <span>Regularly review user access and permissions</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-green-600 dark:text-green-400 mt-1">✓</span>
                        <span>Keep your contact information up to date for security notifications</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-green-600 dark:text-green-400 mt-1">✓</span>
                        <span>Train staff on security awareness and best practices</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-white to-green-50/30 dark:from-gray-800 dark:to-green-950/20 border-2 border-gray-200 dark:border-gray-700 rounded-3xl">
                  <CardContent className="pt-8 pb-8 px-8">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Our Commitment</h3>
                    <ul className="space-y-3 text-gray-600 dark:text-gray-300">
                      <li className="flex items-start gap-3">
                        <span className="text-green-600 dark:text-green-400 mt-1">✓</span>
                        <span>24/7 security monitoring and threat detection</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-green-600 dark:text-green-400 mt-1">✓</span>
                        <span>Regular security updates and patches</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-green-600 dark:text-green-400 mt-1">✓</span>
                        <span>Automated daily backups with encryption</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="text-green-600 dark:text-green-400 mt-1">✓</span>
                        <span>Transparent communication about security incidents</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Security Team */}
        <section className="py-24 bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 dark:from-green-800 dark:via-emerald-800 dark:to-teal-800">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
              Report a Security Issue
            </h2>
            <p className="text-xl text-green-50 mb-10 max-w-2xl mx-auto">
              If you discover a security vulnerability, please let us know immediately.
            </p>
            <a href="mailto:security@syntra.edu">
              <Button
                size="lg"
                className="bg-white text-green-700 hover:bg-green-50 font-bold px-12 py-7 text-lg rounded-2xl shadow-lg hover:shadow-2xl transform transition-all duration-300 hover:scale-105"
              >
                Contact Security Team
              </Button>
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t-2 border-green-200 dark:border-green-900 py-8 bg-gradient-to-br from-white to-green-50/30 dark:from-gray-900 dark:to-green-950/20">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            &copy; 2025 <span className="text-green-600 dark:text-green-400 font-bold">Syntra</span>. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
