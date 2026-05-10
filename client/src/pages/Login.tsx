import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { setPageSeo } from '@/utils/seo';
import { 
  signInWithPopup, 
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  type Auth
} from 'firebase/auth';
import { initializeFirebase, getFirebaseAuth } from '@/lib/firebase';
import { SiteFooter } from '@/components/SiteFooter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SiGoogle } from 'react-icons/si';

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [auth, setAuth] = useState<Auth | null>(null);

  useEffect(() => {
    initializeFirebase().then(() => {
      setAuth(getFirebaseAuth());
    }).catch(err => {
      console.error("Failed to init Firebase:", err);
      setError("Failed to initialize authentication");
    });
  }, []);

  useEffect(() => {
    setPageSeo(
      'Sign in — StackApps',
      'Sign in to StackApps with Google or email to submit apps, manage listings, and write reviews in the directory.',
    );
  }, []);

  const handleGoogleSignIn = async () => {
    if (!auth) return;
    setIsLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setLocation('/hub');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setIsLoading(true);
    setError(null);
    
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      setLocation('/hub');
    } catch (err: any) {
      setError(err.message || `Failed to ${isSignUp ? 'sign up' : 'sign in'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-cyber-black">
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2" data-testid="text-login-title" data-agent-id="login-heading">Welcome to StackApps</h1>
            <p className="text-gray-400">Sign in to submit and manage your apps</p>
          </div>

          <div className="bg-cyber-gray border border-cyber-light rounded-lg p-6 space-y-6">
            <Button
              onClick={handleGoogleSignIn}
              disabled={isLoading || !auth}
              className="w-full bg-white hover:bg-gray-100 text-black font-medium py-6"
              data-testid="button-google-signin"
            >
              <SiGoogle className="w-5 h-5 mr-2" />
              Continue with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-cyber-light" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-cyber-gray px-4 text-gray-500">or</span>
              </div>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="bg-cyber-dark border-cyber-light text-white"
                  data-testid="input-email"
                  data-agent-id="login-email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  required
                  minLength={6}
                  className="bg-cyber-dark border-cyber-light text-white"
                  data-testid="input-password"
                  data-agent-id="login-password"
                />
              </div>

              {error && (
                <div className="bg-red-900/20 border border-red-900/50 rounded p-3 text-red-400 text-sm" data-testid="text-error">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading || !auth}
                className="w-full bg-neon-blue hover:bg-white text-black font-bold py-6"
                data-testid="button-email-submit"
                data-agent-id="login-email-submit"
              >
                {isLoading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
              </Button>
            </form>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-neon-blue hover:text-white text-sm transition-colors"
                data-testid="button-toggle-signup"
                data-agent-id="login-toggle-signup"
              >
                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </button>
            </div>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
