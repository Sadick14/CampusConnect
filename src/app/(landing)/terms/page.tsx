'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { GraduationCap, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';

export default function TermsPage() {
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

      <main className="flex-1">
        <div className="container max-w-4xl mx-auto px-4 py-16">
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">
              Terms of Service
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Last updated: January 1, 2025
            </p>
          </div>

          <div className="prose prose-green dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">1. Agreement to Terms</h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                By accessing and using Syntra ("the Service"), you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">2. Use License</h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                Subject to your compliance with these Terms, we grant you a limited, non-exclusive, non-transferable, revocable license to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                <li>Access and use the Service for your educational institution's internal purposes</li>
                <li>Create and manage student, staff, and institutional records</li>
                <li>Generate reports and analytics from your data</li>
              </ul>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mt-4">
                This license shall automatically terminate if you violate any of these restrictions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">3. Account Registration</h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                To use certain features of the Service, you must register for an account. You agree to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain and promptly update your account information</li>
                <li>Maintain the security of your password and account</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
                <li>Accept responsibility for all activities that occur under your account</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">4. Subscription and Payment</h2>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">Free Trial</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                We offer a 30-day free trial with up to 50 students. No payment information is required to start the trial. After the trial period, you must subscribe to a paid plan to continue using the Service.
              </p>
              
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">Paid Subscriptions</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                Our pricing consists of:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                <li>A one-time setup fee (GHS 300 - 1,000 depending on plan)</li>
                <li>Monthly billing at GHS 20 per active student</li>
              </ul>
              
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 mt-6">Payment Terms</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                <li>All payments require super admin approval before activation</li>
                <li>Monthly fees are based on your current active student count</li>
                <li>We offer a 7-day grace period for late payments</li>
                <li>Accounts may be locked after the grace period expires</li>
                <li>All fees are non-refundable except as required by law</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">5. Acceptable Use</h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                You agree not to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                <li>Use the Service for any illegal purpose or in violation of any laws</li>
                <li>Attempt to gain unauthorized access to any part of the Service</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Upload viruses or other malicious code</li>
                <li>Collect or harvest any information from other users</li>
                <li>Impersonate any person or entity</li>
                <li>Share your account credentials with others</li>
                <li>Use the Service to store or transmit infringing or unlawful material</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">6. Data Ownership and Usage</h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                <strong>Your Data:</strong> You retain all rights to the data you input into the Service. We do not claim ownership of your institution's data, student records, or any other content you provide.
              </p>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                <strong>Our Rights:</strong> You grant us a limited license to use, store, and process your data solely to provide and improve the Service.
              </p>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                <strong>Data Export:</strong> You may export your data at any time in a portable format.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">7. Service Availability</h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                We strive to maintain 99.9% uptime but do not guarantee that the Service will be uninterrupted or error-free. We may modify, suspend, or discontinue any part of the Service at any time with reasonable notice. We are not liable for any modification, suspension, or discontinuation of the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">8. Termination</h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                <strong>By You:</strong> You may cancel your subscription at any time from your account settings. Your access will continue until the end of the current billing period.
              </p>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                <strong>By Us:</strong> We may terminate or suspend your account immediately, without prior notice, for:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
                <li>Violation of these Terms</li>
                <li>Non-payment of fees</li>
                <li>Conduct that may harm other users or the Service</li>
                <li>Fraudulent activity</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">9. Limitation of Liability</h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                To the maximum extent permitted by law, Syntra shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from your use of the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">10. Disclaimer of Warranties</h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                The Service is provided "as is" and "as available" without any warranties of any kind, either express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">11. Changes to Terms</h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                We reserve the right to modify these Terms at any time. We will notify you of material changes via email or through the Service. Your continued use of the Service after such modifications constitutes acceptance of the updated Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">12. Governing Law</h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of Ghana, without regard to its conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">13. Contact Information</h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                If you have any questions about these Terms, please contact us:
              </p>
              <ul className="list-none space-y-2 text-gray-600 dark:text-gray-300 mt-4">
                <li><strong>Email:</strong> legal@syntra.edu</li>
                <li><strong>Phone:</strong> +233 24 123 4567</li>
                <li><strong>Address:</strong> Accra, Ghana</li>
              </ul>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t-2 border-gray-200 dark:border-gray-700 text-center">
            <Link href="/" className="text-green-600 dark:text-green-400 hover:underline font-semibold">
              ← Back to Home
            </Link>
          </div>
        </div>
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
