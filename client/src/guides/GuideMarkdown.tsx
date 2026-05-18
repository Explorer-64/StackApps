import ReactMarkdown from 'react-markdown';
import { Link } from 'wouter';
import type { Components } from 'react-markdown';

const components: Components = {
  h2: ({ children }) => (
    <h2 className="text-xl font-bold text-white mt-10 mb-3 first:mt-0">{children}</h2>
  ),
  p: ({ children }) => <p className="text-gray-300 leading-relaxed mb-4">{children}</p>,
  ul: ({ children }) => <ul className="list-disc pl-5 text-gray-300 space-y-2 mb-4">{children}</ul>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
  a: ({ href, children }) => {
    if (!href) return <span>{children}</span>;
    if (href.startsWith('http')) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-neon-blue hover:underline font-medium"
        >
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className="text-neon-blue hover:underline font-medium">
        {children}
      </Link>
    );
  },
  code: ({ children, className }) => {
    const inline = !className;
    if (inline) {
      return (
        <code className="rounded bg-cyber-dark px-1.5 py-0.5 text-neon-green text-[0.9em]">{children}</code>
      );
    }
    return <code className={className}>{children}</code>;
  },
};

export function GuideMarkdown({ markdown }: { markdown: string }) {
  return (
    <div className="prose prose-invert prose-sm max-w-none">
      <ReactMarkdown components={components}>{markdown}</ReactMarkdown>
    </div>
  );
}
