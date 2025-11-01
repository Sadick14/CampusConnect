'use client'; // Error components must be Client Components

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Home, RefreshCcw } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Error caught:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Error Icon */}
        <div className="flex justify-center animate-fadeInUp">
          <div className="w-24 h-24 bg-gradient-to-br from-red-400 to-orange-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-red-500/50 animate-pulse">
            <AlertTriangle className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
          <div className="space-y-3">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
              Oops! Something Went Wrong
            </h2>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              We encountered an unexpected issue. Don't worry, our team has been notified.
            </p>
          </div>

          {/* Error Details */}
          {error?.message && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-red-100 dark:border-red-900/30 max-w-md mx-auto">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Error Details:
              </p>
              <code className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg block overflow-x-auto">
                {error.message}
              </code>
              {error.digest && (
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}

          {/* Suggestions */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-700 max-w-md mx-auto">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              Try these solutions:
            </p>
            <ul className="space-y-2 text-left">
              <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Refresh the page
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Clear your browser cache
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Contact support if the issue persists
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button
              onClick={reset}
              size="lg"
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transition-all duration-300 rounded-xl text-base px-8"
            >
              <RefreshCcw className="w-5 h-5 mr-2" />
              Try Again
            </Button>
            
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-2 border-gray-300 dark:border-gray-600 hover:border-green-500 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-950/30 rounded-xl text-base px-8"
            >
              <Link href="/" className="flex items-center gap-2">
                <Home className="w-5 h-5" />
                Go to Homepage
              </Link>
            </Button>
          </div>
        </div>

        {/* Help Text */}
        <p className="text-sm text-gray-500 dark:text-gray-500 animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
          Still having issues?{' '}
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

        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

