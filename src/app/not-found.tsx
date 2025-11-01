'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft, Search, BookOpen } from 'lucide-react';

export default function NotFound() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* Animated 404 */}
        <div className="relative mb-8">
          <div className="text-8xl md:text-9xl font-bold text-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text animate-pulse">
            404
          </div>
          
          {/* Floating Elements */}
          <div className="absolute -top-4 -left-4 w-8 h-8 bg-blue-400 rounded-full animate-bounce"></div>
          <div className="absolute top-8 -right-8 w-6 h-6 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute -bottom-2 left-1/4 w-4 h-4 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '1s' }}></div>
          
          {/* Search icon with animation */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <Search className="h-16 w-16 text-gray-300 animate-spin" style={{ animationDuration: '3s' }} />
          </div>
        </div>

        {/* Message */}
        <div className="mb-8 space-y-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 animate-fade-in">
            Oops! Page Not Found
          </h1>
          <p className="text-gray-600 text-lg animate-fade-in" style={{ animationDelay: '0.2s' }}>
            The page you're looking for seems to have wandered off into the digital void.
          </p>
          <p className="text-gray-500 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            Don't worry, even the best explorers sometimes take a wrong turn!
          </p>
        </div>

        {/* Animated Campus Icon */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <BookOpen className="h-24 w-24 text-blue-400 animate-float" />
            <div className="absolute -inset-4 border-2 border-blue-200 rounded-full animate-ping"></div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <Button 
            onClick={() => router.back()} 
            variant="outline" 
            size="lg"
            className="min-w-[160px] group hover:scale-105 transition-transform"
          >
            <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            Go Back
          </Button>
          
          <Link href="/organizations">
            <Button 
              size="lg" 
              className="min-w-[160px] bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 group hover:scale-105 transition-transform"
            >
              <Home className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
              Go Home
            </Button>
          </Link>
        </div>

        {/* Fun Facts */}
        <div className="mt-12 p-6 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/20 animate-fade-in" style={{ animationDelay: '0.8s' }}>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Fun Fact!</h3>
          <p className="text-gray-600 text-sm">
            404 errors got their name from room 404 at CERN, where the web was invented. 
            The room housed the main database, and when it was unavailable, users got a "404" error.
          </p>
        </div>

        {/* Contact Help */}
        <div className="mt-8 text-center animate-fade-in" style={{ animationDelay: '1s' }}>
          <p className="text-gray-500 text-sm">
            Still lost? 
            <Link href="/organizations" className="text-blue-500 hover:text-blue-600 ml-1 underline">
              Return to your organizations
            </Link>
          </p>
        </div>
      </div>

      {/* Background Pattern */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @keyframes blob {
          0%, 100% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
          opacity: 0;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}