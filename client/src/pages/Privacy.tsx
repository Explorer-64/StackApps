import { useEffect } from 'react';
import { Link } from 'wouter';
import { SiteFooter } from '@/components/SiteFooter';
import { setPageSeo } from '@/utils/seo';

export default function Privacy() {
  useEffect(() => {
    setPageSeo(
      'Privacy Policy — StackApps',
      'How StackApps collects, uses, scans, and stores account, listing, review, badge, and public readiness data for the app directory.',
    );
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-cyber-black">
      <header className="bg-cyber-black/80 backdrop-blur-md border-b border-cyber-light sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neon-blue to-neon-purple">
              StackApps
            </Link>
            <Link href="/" className="text-neon-blue hover:text-white font-medium transition-colors">
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-white mb-8" data-testid="text-privacy-title">Privacy Policy</h1>
        
        <div className="prose prose-invert max-w-none">
          <div className="bg-cyber-gray border border-cyber-light rounded-lg p-6 space-y-6 text-gray-300">
            <section>
              <h2 className="text-xl font-bold text-white mb-3">Information We Collect</h2>
              <p>When you use StackApps, we may collect the following information:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Email address and display name when you sign in</li>
                <li>App submissions and related content you provide</li>
                <li>Reviews and ratings you leave on apps</li>
                <li>Public readiness scan results for submitted app URLs</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">How We Use Your Information</h2>
              <p>We use the information we collect to:</p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Provide and maintain our service</li>
                <li>Display your app submissions in our directory</li>
                <li>Show your reviews and ratings to other users</li>
                <li>Check public app URLs and common public files such as llms.txt, robots.txt, sitemap.xml, manifest.json, sw.js, FAQ pages, and blueprint.txt</li>
                <li>Display readiness results, tier labels, embed badge status, and scan scores on live-approved listings</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">Data Storage</h2>
              <p>Your data is stored securely using Firebase services by Google. We implement appropriate security measures to protect your information.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">Contact</h2>
              <p>If you have questions about this privacy policy, please contact us through the platform.</p>
            </section>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
