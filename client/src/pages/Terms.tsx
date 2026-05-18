import { useEffect } from 'react';
import { Link } from 'wouter';
import { SiteFooter } from '@/components/SiteFooter';
import { setPageSeo } from '@/utils/seo';

export default function Terms() {
  useEffect(() => {
    setPageSeo(
      'Terms of Service — StackApps',
      'Rules for using StackApps: submissions, reviews, moderation, public readiness scans, live embed badges, backlinks, and limitations.',
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
        <h1 className="text-4xl font-bold text-white mb-8" data-testid="text-terms-title">Terms of Service</h1>
        
        <div className="prose prose-invert max-w-none">
          <div className="bg-cyber-gray border border-cyber-light rounded-lg p-6 space-y-6 text-gray-300">
            <section>
              <h2 className="text-xl font-bold text-white mb-3">Acceptance of Terms</h2>
              <p>By using StackApps, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">User Responsibilities</h2>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>You are responsible for the content you submit</li>
                <li>You must only submit apps that you own or have rights to share</li>
                <li>You agree not to submit harmful, illegal, or inappropriate content</li>
                <li>Reviews must be honest and relevant to the app being reviewed</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">Moderation</h2>
              <p>All app submissions are subject to moderation. We reserve the right to approve, reject, or remove any content that violates our guidelines or these terms. Backlinks, live embed badge presentation, readiness scan results and tier labels are available for apps approved as live.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">Readiness Scans and Badges</h2>
              <p>By submitting an app URL, you allow StackApps to fetch public pages and public files from that URL to produce readiness results. Scan results, scores, tier labels, listing backlinks, and embed badge status may be displayed publicly for live-approved listings. Owners may request manual rescans, subject to cooldown limits.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">Limitation of Liability</h2>
              <p>StackApps is provided "as is" without warranties of any kind. We are not responsible for any damages arising from your use of our service or apps listed in our directory.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">Changes to Terms</h2>
              <p>We may update these terms from time to time. Continued use of the service constitutes acceptance of any changes.</p>
            </section>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
