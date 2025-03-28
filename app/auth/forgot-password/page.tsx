import { Metadata } from 'next';
import ForgotPasswordForm from '@/components/auth/forgot-password-form';

export const metadata: Metadata = {
  title: 'Forgot Password | Gaming Social',
  description: 'Reset your Gaming Social account password',
};

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-[url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=3270&auto=format&fit=crop')] bg-cover bg-center bg-no-repeat">
      <div className="min-h-screen bg-black/60 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}