'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  GraduationCap, 
  Menu,
  X,
  Mail,
  Phone,
  MapPin,
  MessageSquare,
  Clock,
  Send
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';

export default function ContactPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    school: '',
    message: ''
  });

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form submitted:', formData);
    alert('Thank you! We\'ll get back to you soon.');
    setFormData({ name: '', email: '', phone: '', school: '', message: '' });
  };

  const contactInfo = [
    {
      icon: Mail,
      title: 'Email Us',
      content: 'support@syntra.edu',
      link: 'mailto:support@syntra.edu'
    },
    {
      icon: Phone,
      title: 'Call Us',
      content: '+233 24 123 4567',
      link: 'tel:+233241234567'
    },
    {
      icon: MapPin,
      title: 'Visit Us',
      content: 'Accra, Ghana',
      link: 'https://maps.google.com'
    },
    {
      icon: Clock,
      title: 'Working Hours',
      content: 'Mon-Fri: 8AM - 6PM',
      link: null
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
            <Link href="/contact" className="text-sm font-medium text-green-600">
              Contact
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
              <Link href="/contact" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-green-600">
                Contact
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
                GET IN TOUCH
              </span>
              <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 dark:text-white mb-6">
                <span className="block">We'd Love to</span>
                <span className="block bg-gradient-to-r from-green-600 via-emerald-500 to-teal-500 bg-clip-text text-transparent mt-2">Hear From You</span>
              </h1>
              <p className="mt-6 text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                Have questions? Need a demo? Want to share feedback? Our team is here to help.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Info Cards */}
        <section className="py-20 bg-white dark:bg-gray-900">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {contactInfo.map((info, index) => (
                <Card 
                  key={index}
                  className="bg-gradient-to-br from-white to-green-50/30 dark:from-gray-800 dark:to-green-950/20 border-2 border-gray-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-400 transition-all duration-300 hover:shadow-xl rounded-3xl animate-scale-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardContent className="pt-8 pb-8 px-6 text-center">
                    <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 text-white mb-4 shadow-lg">
                      <info.icon className="h-7 w-7" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      {info.title}
                    </h3>
                    {info.link ? (
                      <a 
                        href={info.link}
                        className="text-green-600 dark:text-green-400 font-medium hover:underline"
                      >
                        {info.content}
                      </a>
                    ) : (
                      <p className="text-gray-600 dark:text-gray-300 font-medium">
                        {info.content}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Form Section */}
        <section className="py-32 bg-gradient-to-br from-gray-50 to-green-50/30 dark:from-gray-900 dark:to-green-950/20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12 animate-fade-in-up">
                <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">
                  Send Us a Message
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  Fill out the form below and we'll get back to you within 24 hours
                </p>
              </div>

              <Card className="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 shadow-xl rounded-3xl animate-scale-in">
                <CardContent className="pt-8 pb-8 px-8">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                          Full Name *
                        </label>
                        <Input
                          required
                          type="text"
                          placeholder="John Doe"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="h-12 rounded-2xl border-2 border-gray-200 dark:border-gray-700 focus:border-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                          Email Address *
                        </label>
                        <Input
                          required
                          type="email"
                          placeholder="john@school.edu"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="h-12 rounded-2xl border-2 border-gray-200 dark:border-gray-700 focus:border-green-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                          Phone Number
                        </label>
                        <Input
                          type="tel"
                          placeholder="+233 24 123 4567"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="h-12 rounded-2xl border-2 border-gray-200 dark:border-gray-700 focus:border-green-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                          School Name
                        </label>
                        <Input
                          type="text"
                          placeholder="ABC International School"
                          value={formData.school}
                          onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                          className="h-12 rounded-2xl border-2 border-gray-200 dark:border-gray-700 focus:border-green-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
                        Message *
                      </label>
                      <Textarea
                        required
                        placeholder="Tell us how we can help you..."
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="min-h-[150px] rounded-2xl border-2 border-gray-200 dark:border-gray-700 focus:border-green-500"
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-6 text-lg rounded-2xl shadow-lg hover:shadow-2xl transform transition-all duration-300 hover:scale-105"
                    >
                      <Send className="h-5 w-5 mr-2" />
                      Send Message
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Map/Location Section */}
        <section className="py-32 bg-white dark:bg-gray-900">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">
                Visit Our Office
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                We're located in the heart of Accra, Ghana
              </p>
            </div>
            <div className="max-w-4xl mx-auto rounded-3xl overflow-hidden shadow-2xl border-2 border-gray-200 dark:border-gray-700">
              <div className="aspect-video bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="h-24 w-24 text-green-600 dark:text-green-400 mx-auto mb-4" />
                  <p className="text-xl font-bold text-gray-900 dark:text-white">Accra, Ghana</p>
                  <p className="text-gray-600 dark:text-gray-400">Interactive map coming soon</p>
                </div>
              </div>
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
            <p className="text-sm text-gray-600 dark:text-gray-400">
              &copy; 2025 <span className="text-green-600 dark:text-green-400 font-bold">Syntra</span>. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
