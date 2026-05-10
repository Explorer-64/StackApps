import { Link } from 'wouter';
import { useState } from 'react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { ADMIN_EMAILS } from '@/lib/admins';

interface NavBarProps {
  activePage?: 'home' | 'hub' | 'dashboard' | 'workstation' | 'admin' | 'faq' | 'settings' | 'for-builders' | 'scan';
}

export function NavBar({ activePage }: NavBarProps) {
  const { user } = useCurrentUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAdmin = user?.email ? ADMIN_EMAILS.includes(user.email) : false;

  const linkClass = (page: string) => {
    if (activePage === page) {
      return 'text-neon-purple font-medium text-sm uppercase tracking-wider';
    }
    return 'text-gray-300 hover:text-neon-blue font-medium transition-colors text-sm uppercase tracking-wider';
  };

  return (
    <header className="bg-cyber-black/80 backdrop-blur-md border-b border-cyber-light sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <Link href={user ? "/hub" : "/"} className="flex items-center gap-2 group" data-testid="link-home">
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neon-blue to-neon-purple group-hover:from-neon-green group-hover:to-neon-blue transition-all duration-500">
              StackApps
            </span>
          </Link>

          <div className="flex items-center gap-4 md:hidden">
            <button
              className="p-2 text-gray-400 hover:text-neon-blue focus:outline-none"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {user ? (
              <>
                <Link href="/hub" className={linkClass('hub')} data-testid="link-hub">
                  My Apps
                </Link>
                <Link href="/dashboard" className={linkClass('dashboard')} data-testid="link-dashboard">
                  The Stackhouse
                </Link>
                {isAdmin && (
                  <>
                    <Link href="/admin" className={linkClass('admin')} data-testid="link-admin">
                      Admin
                    </Link>
                    <Link href="/workstation" className={linkClass('workstation')} data-testid="link-workstation">
                      Workstation
                    </Link>
                  </>
                )}
                <Link href="/settings" className={linkClass('settings')} data-testid="link-settings">
                  Settings
                </Link>
                <Link href="/logout" className="px-4 py-2 border border-cyber-light hover:border-white text-gray-300 hover:text-white rounded-sm font-medium transition-colors text-sm uppercase tracking-wider" data-testid="link-logout">
                  Logout
                </Link>
              </>
            ) : (
              <>
                <Link href="/dashboard" className={linkClass('dashboard')} data-testid="link-dashboard">
                  The Stackhouse
                </Link>
                <Link
                  href="/scan"
                  className={linkClass('scan')}
                  data-agent-id="nav-check-app"
                >
                  Check your app
                </Link>
                <Link href="/for-builders" className={linkClass('for-builders')} data-testid="link-for-builders">
                  For Builders
                </Link>
                <Link href="/under-construction" className="text-gray-300 hover:text-neon-yellow font-medium transition-colors text-sm uppercase tracking-wider" data-testid="link-under-construction">
                  Under Construction
                </Link>
                <Link href="/faq" className={linkClass('faq')} data-testid="link-faq">
                  Q&A
                </Link>
                <Link
                  href="/login"
                  className="px-5 py-2 bg-neon-blue text-black hover:bg-white rounded-sm font-bold transition-all shadow-[0_0_10px_rgba(0,243,255,0.3)] hover:shadow-[0_0_20px_rgba(0,243,255,0.5)] text-sm uppercase tracking-wider"
                  data-testid="link-signin"
                >
                  List Free
                </Link>
              </>
            )}
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden mt-4 flex flex-col space-y-2 bg-cyber-dark p-4 rounded-sm border border-cyber-light animate-in slide-in-from-top-2">
            {user ? (
              <>
                <Link href="/hub" className="text-gray-300 font-medium py-2 px-2 hover:bg-cyber-light hover:text-neon-blue rounded-sm" onClick={() => setMobileMenuOpen(false)}>
                  My Apps
                </Link>
                <Link href="/dashboard" className="text-gray-300 font-medium py-2 px-2 hover:bg-cyber-light hover:text-neon-blue rounded-sm" onClick={() => setMobileMenuOpen(false)}>
                  The Stackhouse
                </Link>
                {isAdmin && (
                  <>
                    <Link href="/admin" className="text-gray-300 font-medium py-2 px-2 hover:bg-cyber-light hover:text-neon-green rounded-sm" onClick={() => setMobileMenuOpen(false)}>
                      Admin
                    </Link>
                    <Link href="/workstation" className="text-gray-300 font-medium py-2 px-2 hover:bg-cyber-light hover:text-neon-green rounded-sm" onClick={() => setMobileMenuOpen(false)}>
                      Workstation
                    </Link>
                  </>
                )}
                <div className="border-t border-cyber-light pt-2 mt-2">
                  <Link href="/settings" className="block w-full text-left px-2 py-2 text-gray-400 font-medium hover:bg-cyber-light hover:text-neon-purple rounded-sm" onClick={() => setMobileMenuOpen(false)}>
                    Settings
                  </Link>
                  <Link href="/logout" className="block w-full text-left px-2 py-2 text-gray-400 font-medium hover:bg-cyber-light hover:text-white rounded-sm" onClick={() => setMobileMenuOpen(false)}>
                    Logout
                  </Link>
                </div>
              </>
            ) : (
              <>
                <Link href="/dashboard" className="text-gray-300 font-medium py-2 px-2 hover:bg-cyber-light hover:text-neon-blue rounded-sm" onClick={() => setMobileMenuOpen(false)}>
                  The Stackhouse
                </Link>
                <Link href="/scan" className="text-gray-300 font-medium py-2 px-2 hover:bg-cyber-light hover:text-neon-blue rounded-sm" onClick={() => setMobileMenuOpen(false)}>
                  Check your app
                </Link>
                <Link href="/for-builders" className="text-gray-300 font-medium py-2 px-2 hover:bg-cyber-light hover:text-neon-blue rounded-sm" onClick={() => setMobileMenuOpen(false)}>
                  For Builders
                </Link>
                <Link href="/under-construction" className="text-gray-300 font-medium py-2 px-2 hover:bg-cyber-light hover:text-neon-yellow rounded-sm" onClick={() => setMobileMenuOpen(false)}>
                  Under Construction
                </Link>
                <Link href="/faq" className="text-gray-300 font-medium py-2 px-2 hover:bg-cyber-light hover:text-neon-pink rounded-sm" onClick={() => setMobileMenuOpen(false)}>
                  Q&A
                </Link>
                <div className="border-t border-cyber-light pt-2 mt-2">
                  <Link
                    href="/login"
                    className="block w-full text-center px-4 py-2 bg-neon-blue text-black rounded-sm font-bold shadow-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    List Free
                  </Link>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
