import { Metadata } from 'next';
import SignUpForm from '@/components/auth/signup-form';

export const metadata: Metadata = {
  title: 'Sign Up | Gaming Social',
  description: 'Create your Gaming Social account',
};

// export default function TestToast() {
//   const { toast } = useToast();

//   return (
//     <Button onClick={() => toast({ title: "Test Toast", description: "This is a test toast message!" })}>
//       Show Toast
//     </Button>
//   );
// }
export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-[url('https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=3270&auto=format&fit=crop')] bg-cover bg-center bg-no-repeat">
      <div className="min-h-screen bg-black/60 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <SignUpForm />
        </div>
      </div>
    </div>
  );
}