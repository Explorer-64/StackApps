import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useCurrentUser } from '@/hooks/use-current-user';
import { NavBar } from '@/components/NavBar';
import { SiteFooter } from '@/components/SiteFooter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';
import { ADMIN_EMAILS } from '@/lib/admins';
import { NoIndex } from '@/components/NoIndex';

export default function Workstation() {
  const { user, loading } = useCurrentUser();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && (!user || !user.email || !ADMIN_EMAILS.includes(user.email))) {
      setLocation('/');
    }
  }, [user, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cyber-black text-neon-blue">
        Loading...
      </div>
    );
  }

  if (!user || !user.email || !ADMIN_EMAILS.includes(user.email)) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-cyber-black">
      <NoIndex />
      <NavBar activePage="workstation" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-grow w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Workstation</h1>
          <p className="text-gray-400">Your private dashboard for managing projects</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <a
            // Temporary external link; this route is intentionally a lightweight launcher.
            href="https://stackspent.app"
            target="_blank"
            rel="noopener noreferrer"
            className="block group"
            data-testid="link-stackspent"
          >
            <Card className="bg-cyber-dark border-cyber-light hover:border-neon-blue transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,243,255,0.2)]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white group-hover:text-neon-blue transition-colors">
                    StackSpent
                  </CardTitle>
                  <ExternalLink className="w-5 h-5 text-gray-500 group-hover:text-neon-blue transition-colors" />
                </div>
                <CardDescription className="text-gray-400">
                  Personal expense tracking and management
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-neon-green/20 text-neon-green text-xs rounded-sm">
                    Active
                  </span>
                  <span className="text-gray-500 text-sm">External app</span>
                </div>
              </CardContent>
            </Card>
          </a>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
