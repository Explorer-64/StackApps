export type GuideSlug = 'llms-txt' | 'faq' | 'cli-silver';

export type GuideListItem = {
  slug: GuideSlug;
  title: string;
  blurb: string;
  seoTitle: string;
  seoDescription: string;
};

export const GUIDE_LIST: GuideListItem[] = [
  {
    slug: 'llms-txt',
    title: 'llms.txt — your AI-era identity file',
    blurb: 'Why `/llms.txt` exists, what belongs in it, and how our scan checks it.',
    seoTitle: 'Guide: llms.txt for AI & crawler discovery — StackApps',
    seoDescription:
      'Why agents skip sites without /llms.txt, what to put in the file, and how StackApps verifies it with a HEAD request (open-source scanner).',
  },
  {
    slug: 'faq',
    title: 'FAQ at `/faq` — one stable URL for the agent era',
    blurb: 'We probe exactly `/faq` with HEAD; here is how to pass without lying to humans.',
    seoTitle: 'Guide: standardized /faq for StackApps readiness — StackApps',
    seoDescription:
      'Why a canonical FAQ URL matters for AI tools, how to implement or redirect `/faq`, and what our scanner actually checks (HEAD /faq → 200).',
  },
  {
    slug: 'cli-silver',
    title: 'CLI check & Silver tier — automation entry points',
    blurb: '“CLI” in our scan means documented install/run commands—not “ship a TUI”.',
    seoTitle: 'Guide: CLI signal & Silver readiness tier — StackApps',
    seoDescription:
      'How StackApps detects CLI patterns in HTML, llms.txt, or blueprint.txt, and how that fits Silver (Bronze + CLI + FAQ + viewport).',
  },
];

export function getGuideMeta(slug: string): GuideListItem | undefined {
  return GUIDE_LIST.find((g) => g.slug === slug);
}
