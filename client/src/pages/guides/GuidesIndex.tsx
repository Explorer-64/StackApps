import { useEffect } from 'react';
import { Link } from 'wouter';
import { NavBar } from '@/components/NavBar';
import { SiteFooter } from '@/components/SiteFooter';
import { setPageSeo } from '@/utils/seo';
import { GUIDE_LIST } from '@/guides/guideRegistry';

export default function GuidesIndex() {
  useEffect(() => {
    setPageSeo(
      'Guides — AI & crawl readiness — StackApps',
      'Short, scanner-accurate guides: llms.txt, /faq, CLI signals and the Silver tier. Same checks we ship in open source.',
    );
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-cyber-black">
      <NavBar activePage="guides" />

      <main className="flex-grow max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 w-full">
        <p className="text-sm uppercase tracking-wider text-neon-blue font-semibold mb-2">Guides</p>
        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
          Ship what the scan actually measures
        </h1>
        <p className="mt-4 text-gray-400 text-lg leading-relaxed">
          No black box: every check maps to code in our repo. These three notes cut confusion for builders who want Bronze, Silver, or Gold without guessing. Start with a <Link href="/scan" className="text-neon-blue hover:text-white transition-colors">free scan</Link>, then see the <Link href="/faq" className="text-neon-blue hover:text-white transition-colors">FAQ</Link> for listing questions.
        </p>

        <ol className="mt-10 space-y-4 list-decimal list-inside marker:text-neon-purple marker:font-bold">
          {GUIDE_LIST.map((g) => (
            <li key={g.slug} className="text-gray-200">
              <Link
                href={`/guides/${g.slug}`}
                className="font-semibold text-white hover:text-neon-blue transition-colors"
              >
                {g.title}
              </Link>
              <p className="mt-1 ml-6 text-gray-400 text-sm leading-relaxed">{g.blurb}</p>
            </li>
          ))}
        </ol>
      </main>

      <SiteFooter />
    </div>
  );
}
