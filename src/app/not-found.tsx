'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft, Search } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="relative">
          <h1 className="text-[150px] md:text-[220px] font-black text-green-100 dark:text-green-900/30 leading-none select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="space-y-4 animate-fadeInUp">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-400 to-emerald-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-green-500/50 animate-float">
                <Search className="w-12 h-12 text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
          <div className="space-y-3">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
              Page Not Found
            </h2>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              Oops! The page you're looking for seems to have wandered off. 
              Let's get you back on track.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-700 max-w-md mx-auto">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              Here are some helpful links:
            </p>
            <ul className="space-y-2 text-left">
              <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Check the URL for typos
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Return to the homepage
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Contact support if the problem persists
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transition-all duration-300 rounded-xl text-base px-8"
            >
              <Link href="/" className="flex items-center gap-2">
                <Home className="w-5 h-5" />
                Go to Homepage
              </Link>
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              onClick={() => router.back()}
              className="border-2 border-gray-300 dark:border-gray-600 hover:border-green-500 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-950/30 rounded-xl text-base px-8"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Go Back
            </Button>
          </div>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-500 animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
          Need assistance?{' '}
          <Link href="/contact" className="text-green-600 dark:text-green-400 hover:underline font-medium">
            Contact our support team
          </Link>
        </p>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
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
            transform: translateY(-10px);
          }
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out forwards;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
