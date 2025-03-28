import { Metadata } from 'next';
import LoginForm from '@/components/auth/login-form';

export const metadata: Metadata = {
  title: 'Login | Gaming Social',
  description: 'Login to your Gaming Social account',
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[url('https://images.unsplash.com/photo-1538481199705-c710c4e965fc?q=80&w=3265&auto=format&fit=crop')] bg-cover bg-center bg-no-repeat">
      <div className="min-h-screen bg-black/60 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}