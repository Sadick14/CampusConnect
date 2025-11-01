'use client'; // Global error components must be Client Components

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error caught:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center px-4">
          <div className="max-w-2xl w-full text-center space-y-8">
            {/* Error Icon */}
            <div className="flex justify-center">
              <div className="w-24 h-24 bg-gradient-to-br from-red-400 to-orange-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-red-500/50">
                <AlertTriangle className="w-12 h-12 text-white" />
              </div>
            </div>

            {/* Content */}
            <div className="space-y-6">
              <div className="space-y-3">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
                  Critical Error
                </h1>
                <p className="text-lg md:text-xl text-gray-600 max-w-md mx-auto">
                  We encountered a critical error. Our team has been automatically notified.
                </p>
              </div>

              {/* Error Details */}
              {error?.message && (
                <div className="bg-white rounded-2xl p-6 shadow-xl border border-red-100 max-w-md mx-auto">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Error Details:
                  </p>
                  <code className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg block overflow-x-auto">
                    {error.message}
                  </code>
                  {error.digest && (
                    <p className="text-xs text-gray-500 mt-2">
                      Error ID: {error.digest}
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                <button
                  onClick={reset}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transition-all duration-300 rounded-xl text-base px-8 py-3 font-medium"
                >
                  <RefreshCcw className="w-5 h-5" />
                  Try Again
                </button>
                
                <a
                  href="/"
                  className="inline-flex items-center gap-2 border-2 border-gray-300 hover:border-green-500 hover:bg-green-50 rounded-xl text-base px-8 py-3 font-medium transition-all duration-300"
                >
                  Go to Homepage
                </a>
              </div>
            </div>

            {/* Help Text */}
            <p className="text-sm text-gray-500">
              If this issue continues, please{' '}
              <a href="/contact" className="text-green-600 hover:underline font-medium">
                contact our support team
              </a>
            </p>
          </div>
        </div>

        <style jsx>{`
          body {
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
              'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
              sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
        `}</style>
      </body>
    </html>
  );
}
