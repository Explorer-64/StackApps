import { useEffect, useState } from 'react';
import { Link, useRoute } from 'wouter';
import { ChevronRight } from 'lucide-react';
import { NavBar } from '@/components/NavBar';
import { SiteFooter } from '@/components/SiteFooter';
import {
  McpBlueprintTestResults,
  type McpTestResult,
} from '@/components/McpBlueprintTestResults';
import { setPageSeo } from '@/utils/seo';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const STUB_FETCHES = [
  {
    label: 'robots.txt (stub Imagcon)',
    url: 'https://stackapps.app/stubs/imagcon/robots.txt',
  },
  {
    label: 'llms.txt (stub Imagcon)',
    url: 'https://stackapps.app/stubs/imagcon/llms.txt',
  },
  {
    label: 'blueprint.txt (blueprint stubs — Imagcon)',
    url: 'https://stackapps.app/stubs-bp/imagcon/blueprint.txt',
  },
] as const;

type RunDetail = {
  id: string;
  model: string;
  savedAt: string;
  savedBy?: string;
  result: McpTestResult;
};

export default function McpBlueprintResultPage() {
  const [, params] = useRoute('/mcp-blueprint-results/:id');
  const id = params?.id ?? '';
  const [loading, setLoading] = useState(true);
  const [run, setRun] = useState<RunDetail | null>(null);
  const [texts, setTexts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setRun(null);
      return;
    }

    setLoading(true);
    void fetch(`/api/mcp-blueprint-results/${encodeURIComponent(id)}`)
      .then(async (r) => {
        if (r.status === 404) {
          setRun(null);
          return;
        }
        const data = (await r.json()) as RunDetail;
        setRun(data);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!run) return;
    Promise.all(STUB_FETCHES.map((entry) => fetch(entry.url).then((res) => res.text()))).then(
      (bodies) => {
        const next: Record<string, string> = {};
        STUB_FETCHES.forEach((entry, i) => {
          next[entry.url] = bodies[i] ?? '';
        });
        setTexts(next);
      },
    );
  }, [run]);

  useEffect(() => {
    if (!run?.result?.task) return;
    setPageSeo(
      `MCP Blueprint run — ${run.model} — StackApps`,
      `${run.result.task.slice(0, 155)}`,
    );
  }, [run]);

  return (
    <div className="min-h-screen flex flex-col bg-cyber-black">
      <NavBar />
      <main className="flex-grow w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <Link
              href="/mcp-blueprint-results"
              className="text-sm text-neon-blue font-semibold hover:text-neon-green transition-colors"
            >
              ← All benchmark runs
            </Link>
            <h1 className="mt-4 text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              MCP Blueprint run detail
            </h1>
            {run && (
              <p className="mt-2 text-sm text-gray-500">
                {run.model} ·{' '}
                {run.savedAt
                  ? new Date(run.savedAt).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })
                  : ''}
              </p>
            )}
          </div>
        </div>

        {loading && (
          <div className="flex flex-col items-center py-24 gap-3">
            <div className="h-10 w-10 rounded-full border-2 border-cyber-light border-t-neon-blue animate-spin" />
            <p className="text-sm text-gray-500">Loading run…</p>
          </div>
        )}

        {!loading && !run && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-8 text-center">
            <p className="text-red-400 font-medium">Run not found.</p>
            <Link
              href="/mcp-blueprint-results"
              className="inline-block mt-4 text-neon-blue font-semibold hover:text-neon-green"
            >
              Back to results
            </Link>
          </div>
        )}

        {run && (
          <>
            <div className="rounded-lg border border-cyber-light bg-cyber-dark/50 px-4 py-3 text-sm text-gray-400 leading-relaxed">
              {run.result.task}
            </div>
            <McpBlueprintTestResults result={run.result} />

            <section className="space-y-3 pt-6 border-t border-cyber-light">
              <h2 className="text-lg font-bold text-white">Test files used</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                Raw payloads from the Imagcon stubs used during the benchmark rounds.
              </p>
              <div className="space-y-2">
                {STUB_FETCHES.map((entry) => (
                  <Collapsible key={entry.url} className="group">
                    <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-lg border border-cyber-light bg-cyber-dark/60 px-4 py-3 text-left text-sm font-semibold text-white hover:bg-cyber-dark transition-colors">
                      <ChevronRight className="h-4 w-4 shrink-0 transition-transform duration-150 group-data-[state=open]:rotate-90" />
                      <span>{entry.label}</span>
                      <span className="ml-auto font-mono text-[10px] text-gray-500 truncate max-w-[48%]">
                        {entry.url}
                      </span>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <pre className="mt-2 whitespace-pre-wrap break-words rounded-lg border border-cyber-light bg-cyber-black/80 p-4 text-xs font-mono text-gray-300 max-h-[min(420px,50vh)] overflow-auto">
                        {texts[entry.url] ?? '…'}
                      </pre>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
