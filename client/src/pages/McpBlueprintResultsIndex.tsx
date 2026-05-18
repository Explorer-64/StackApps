import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { NavBar } from '@/components/NavBar';
import { SiteFooter } from '@/components/SiteFooter';
import { type McpTestResult } from '@/components/McpBlueprintTestResults';
import { setPageSeo } from '@/utils/seo';
import { ArrowRight } from 'lucide-react';

type RunRow = {
  id: string;
  model: string;
  savedAt: string;
  savedBy?: string;
  result: McpTestResult;
};

function overheadPctFromVerdict(verdict: string): number | null {
  const match = verdict.match(/~(\d+)%/);
  if (!match) return null;
  return Number(match[1]);
}

function modelLabel(slug: string): string {
  const m = slug.trim().toLowerCase();
  if (m === 'gpt4o') return 'GPT-4o';
  return m.charAt(0).toUpperCase() + m.slice(1);
}

export default function McpBlueprintResultsIndex() {
  const [rows, setRows] = useState<RunRow[] | null>(null);

  useEffect(() => {
    setPageSeo(
      'MCP Blueprint benchmark results — StackApps',
      'Published MCP Blueprint Protocol discovery-efficiency benchmarks: guided vs blueprint-assisted agent runs.',
    );
  }, []);

  useEffect(() => {
    void fetch('/api/mcp-blueprint-results')
      .then((r) => r.json())
      .then((d) => setRows(d as RunRow[]));
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-cyber-black">
      <NavBar />
      <main className="flex-grow w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 space-y-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            MCP Blueprint benchmark results
          </h1>
          <p className="mt-4 text-gray-400 text-lg leading-relaxed">
            Inspectable discovery overhead scores from the MCP Blueprint Protocol golf benchmark —
            baseline vs blueprint-guided and adoption runs.
          </p>
        </div>

        {rows === null && (
          <div className="flex flex-col items-center py-16 gap-3">
            <div className="h-10 w-10 rounded-full border-2 border-cyber-light border-t-neon-blue animate-spin" />
            <p className="text-sm text-gray-500">Loading runs…</p>
          </div>
        )}

        {rows && rows.length === 0 && (
          <p className="text-gray-400 text-center py-16">No published runs yet.</p>
        )}

        {rows && rows.length > 0 && (
          <div className="grid gap-4">
            {rows.map((run) => {
              const pct = overheadPctFromVerdict(run.result.verdict);
              const formatted = run.savedAt
                ? new Date(run.savedAt).toLocaleString(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })
                : '';

              return (
                <article
                  key={run.id}
                  className="rounded-xl border border-cyber-light bg-cyber-dark/70 p-6 shadow-[0_0_0_1px_rgba(0,229,204,0.04)] hover:border-neon-blue/35 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="space-y-2 flex-1 min-w-0">
                      <p className="text-xs uppercase tracking-widest text-neon-blue font-bold">
                        {modelLabel(run.model)}
                      </p>
                      <p className="text-sm text-gray-500">{formatted}</p>
                      <p className="text-gray-300 text-sm leading-relaxed">{run.result.verdict}</p>
                      {pct !== null ? (
                        <p className="text-neon-green font-mono text-sm">
                          Guided overhead delta: ~{pct}%
                        </p>
                      ) : (
                        <p className="text-gray-500 text-sm font-mono">No % in guided verdict</p>
                      )}
                    </div>
                    <Link
                      href={`/mcp-blueprint-results/${run.id}`}
                      className="inline-flex items-center gap-2 shrink-0 px-4 py-2 rounded-sm bg-neon-blue/15 border border-neon-blue/40 text-neon-blue text-sm font-bold hover:bg-neon-blue hover:text-black transition-colors"
                    >
                      View run
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
