import { useEffect } from 'react';
import { Link, useRoute, useLocation } from 'wouter';
import { NavBar } from '@/components/NavBar';
import { SiteFooter } from '@/components/SiteFooter';
import { setPageSeo } from '@/utils/seo';
import { getGuideMeta, type GuideSlug } from '@/guides/guideRegistry';
import { GuideMarkdown } from '@/guides/GuideMarkdown';

import llmsTxt from '@/guides/content/llms-txt.md?raw';
import faqMd from '@/guides/content/faq.md?raw';
import cliSilverMd from '@/guides/content/cli-silver.md?raw';

const GUIDE_BODIES: Record<GuideSlug, string> = {
  'llms-txt': llmsTxt,
  faq: faqMd,
  'cli-silver': cliSilverMd,
};

export default function GuideArticle() {
  const [match, params] = useRoute('/guides/:slug');
  const [, setLocation] = useLocation();
  const slug = params?.slug ?? '';
  const meta = getGuideMeta(slug);
  const body = meta ? GUIDE_BODIES[meta.slug] : undefined;

  useEffect(() => {
    if (!match) return;
    if (!meta) {
      setLocation('/guides');
      return;
    }
    setPageSeo(meta.seoTitle, meta.seoDescription);
  }, [match, meta, setLocation]);

  if (!match || !meta || !body) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-cyber-black">
      <NavBar activePage="guides" />

      <main className="flex-grow max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 w-full">
        <nav className="text-sm text-gray-500 mb-8">
          <Link href="/guides" className="text-neon-blue hover:underline">
            Guides
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-400">{meta.title}</span>
        </nav>

        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">{meta.title}</h1>
        <p className="mt-3 text-gray-400 text-sm leading-relaxed">{meta.blurb}</p>

        <article className="mt-10 border-t border-cyber-light pt-10">
          <GuideMarkdown markdown={body} />
        </article>

        <p className="mt-12 text-sm text-gray-500">
          <Link href="/guides" className="text-neon-blue hover:underline">
            ← All guides
          </Link>
          {' · '}
          <Link href="/scan" className="text-neon-blue hover:underline">
            Run the free scan
          </Link>
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}
