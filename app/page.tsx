'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TowerControl } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-[url('https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=3271&auto=format&fit=crop')] bg-cover bg-center bg-no-repeat">
      <div className="min-h-screen bg-black/60 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="mb-8">
            <div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <TowerControl className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">Gaming Social</h1>
            <p className="text-gray-300">Connect with gamers worldwide</p>
          </div>
          
          <div className="space-y-4">
            <Button asChild className="w-full bg-purple-600 hover:bg-purple-700 text-white">
              <Link href="/auth/signup">Sign Up</Link>
            </Button>
            <Button asChild variant="outline" className="w-full border-purple-500 text-purple-400 hover:bg-purple-600/10 hover:text-purple-300">
              <Link href="/auth/login">Login</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}