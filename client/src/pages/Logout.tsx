import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { signOut } from 'firebase/auth';
import { initializeFirebase, getFirebaseAuth } from '@/lib/firebase';

export default function Logout() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const doLogout = async () => {
      try {
        await initializeFirebase();
        const auth = getFirebaseAuth();
        await signOut(auth);
      } catch (error) {
        console.error('Logout error:', error);
      }
      setLocation('/');
    };
    doLogout();
  }, [setLocation]);

  return (
    <div className="min-h-screen bg-cyber-black flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-blue mx-auto"></div>
        <p className="mt-4 text-gray-400">Signing out...</p>
      </div>
    </div>
  );
}
