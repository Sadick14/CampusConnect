'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Building2, ArrowLeft, Plus } from 'lucide-react';

export default function OrganizationNotFound() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* Animated Organization Icon */}
        <div className="relative mb-8">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <Building2 className="h-32 w-32 text-blue-400 animate-float" />
              <div className="absolute -inset-4 border-2 border-blue-200 rounded-full animate-ping"></div>
            </div>
          </div>
          
          <div className="text-6xl md:text-7xl font-bold text-transparent bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text animate-pulse">
            Organization Not Found
          </div>
        </div>

        {/* Message */}
        <div className="mb-8 space-y-4">
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 animate-fade-in">
            This Organization Doesn't Exist
          </h1>
          <p className="text-gray-600 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            The organization you're looking for might have been moved, deleted, or never existed.
          </p>
          <p className="text-gray-500 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            Let's get you back to your organizations!
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <Button 
            onClick={() => router.back()} 
            variant="outline" 
            size="lg"
            className="min-w-[180px] group hover:scale-105 transition-transform"
          >
            <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            Go Back
          </Button>
          
          <Link href="/organizations">
            <Button 
              size="lg" 
              className="min-w-[180px] bg-blue-600 hover:bg-blue-700 group hover:scale-105 transition-transform"
            >
              <Building2 className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
              My Organizations
            </Button>
          </Link>
        </div>

        {/* Create New Organization */}
        <div className="mt-8 animate-fade-in" style={{ animationDelay: '0.8s' }}>
          <p className="text-gray-600 mb-4">Don't have any organizations yet?</p>
          <Link href="/organizations">
            <Button variant="outline" size="lg" className="group">
              <Plus className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform" />
              Create Your First Organization
            </Button>
          </Link>
        </div>
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
            transform: translateY(-15px);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
          opacity: 0;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}