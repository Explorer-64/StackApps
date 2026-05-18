import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Lock } from 'lucide-react';
import { NavBar } from '@/components/NavBar';
import { SiteFooter } from '@/components/SiteFooter';
import { NoIndex } from '@/components/NoIndex';
import { useCurrentUser } from '@/hooks/use-current-user';
import { isAdmin } from '@/lib/admins';
import { setPageSeo } from '@/utils/seo';
import { getFirebaseAuth } from '@/lib/firebase';
import {
  McpBlueprintTestResults,
  type McpTestResult,
} from '@/components/McpBlueprintTestResults';
import type { User } from 'firebase/auth';

type ModelKey = 'claude' | 'gemini' | 'grok' | 'gpt4o';

const MODEL_LABELS: Record<ModelKey, string> = {
  claude: 'Claude',
  gemini: 'Gemini',
  grok: 'Grok',
  gpt4o: 'GPT-4o',
};

const FIXED_TASK =
  'Generate a complete set of PWA icons for a recipe app — all required sizes, maskable ' +
  'variants, iOS icons, Android icons, and manifest.json, packaged and ready to deploy.';

export function McpBlueprintTestPanel({ user }: { user: User }) {
  const [model, setModel] = useState<ModelKey>('claude');
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<McpTestResult | null>(null);

  async function getToken() {
    const auth = getFirebaseAuth();
    return auth.currentUser?.getIdToken() ?? null;
  }

  const backendUrl = (import.meta.env.VITE_BACKEND_URL as string | undefined)?.replace(/\/$/, '') ?? '';

  async function runTest() {
    setError(null);
    setSaved(false);
    setBusy(true);
    try {
      const token = await getToken();
      if (!token) { setError('Could not get auth token.'); setBusy(false); return; }
      const res = await fetch(`${backendUrl}/api/mcp-blueprint-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ model }),
      });
      const data = (await res.json()) as McpTestResult & { detail?: string };
      if (!res.ok) { setError(typeof data.detail === 'string' ? data.detail : 'Test failed.'); return; }
      setResult(data);
    } catch {
      setError('Could not reach the test service. Try again.');
    } finally {
      setBusy(false);
    }
  }

  async function saveRun() {
    if (!result) return;
    setSaving(true);
    try {
      const token = await getToken();
      if (!token) { setError('Could not get auth token.'); return; }
      const res = await fetch(`${backendUrl}/api/mcp-blueprint-results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ model, result }),
      });
      if (!res.ok) { setError('Save failed.'); return; }
      setSaved(true);
    } catch {
      setError('Could not save the run.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-gray-300 mb-3">Model</p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(MODEL_LABELS) as ModelKey[]).map((m) => (
            <button
              key={m}
              type="button"
              disabled={busy}
              onClick={() => setModel(m)}
              className={`px-4 py-2 rounded-sm text-sm font-semibold border transition-colors disabled:opacity-40 ${
                model === m
                  ? 'bg-neon-blue text-black border-neon-blue'
                  : 'bg-transparent text-gray-300 border-cyber-light hover:border-neon-blue/50'
              }`}
              data-agent-id={`mcp-test-model-${m}`}
            >
              {MODEL_LABELS[m]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-300 mb-3">Task</p>
        <div className="rounded-sm border border-cyber-light bg-cyber-dark px-4 py-3 text-gray-400 text-sm leading-relaxed">
          {FIXED_TASK}
        </div>
        <p className="mt-1.5 text-xs text-gray-600">Task is fixed — the scoring harness is wired to this scenario.</p>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <button
          type="button"
          onClick={() => void runTest()}
          disabled={busy}
          data-agent-id="mcp-blueprint-test-run"
          className="px-6 py-3 bg-neon-green text-black font-extrabold rounded-sm uppercase tracking-wide hover:bg-white transition-colors disabled:opacity-50"
        >
          {busy ? 'Running… (up to 10 minutes)' : 'Run test'}
        </button>

        {result && !saved && (
          <button
            type="button"
            onClick={() => void saveRun()}
            disabled={saving}
            className="px-6 py-3 bg-neon-blue text-black font-extrabold rounded-sm uppercase tracking-wide hover:bg-white transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save & publish run'}
          </button>
        )}

        {saved && (
          <Link href="/mcp-blueprint-results" className="text-neon-green font-semibold hover:underline">
            ✓ Saved — view published results →
          </Link>
        )}

        <p className="text-xs text-gray-500">Running as {user.email}</p>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {result && (
        <div>
          <h3 className="text-lg font-bold text-white mb-4">Results</h3>
          <McpBlueprintTestResults result={result} />
        </div>
      )}
    </div>
  );
}

export default function McpBlueprintTest() {
  const { user, loading: authLoading } = useCurrentUser();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin(user))) setLocation('/');
  }, [user, authLoading, setLocation]);

  useEffect(() => {
    setPageSeo(
      'MCP Blueprint Test — StackApps',
      'Test whether publishing a blueprint.txt reduces AI agent discovery overhead for your MCP server.',
    );
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-cyber-black">
      <NoIndex />
      <NavBar />
      <main className="flex-grow w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">MCP Blueprint Test</h1>
        <p className="mt-3 text-gray-400 text-lg">
          Test whether publishing a <span className="text-neon-blue font-mono">blueprint.txt</span> reduces AI agent
          discovery overhead for your MCP server.
        </p>
        <div className="mt-10">
          {user ? (
            <McpBlueprintTestPanel user={user} />
          ) : (
            <div className="rounded-xl border border-cyber-light bg-cyber-dark/80 p-6 flex items-start gap-4">
              <Lock className="h-6 w-6 text-neon-yellow shrink-0 mt-0.5" aria-hidden />
              <div>
                <p className="text-white font-medium">Sign in required</p>
                <p className="text-sm text-gray-400 mt-1">
                  Admin only. Published results are public at{' '}
                  <Link href="/mcp-blueprint-results" className="text-neon-blue hover:text-neon-green">
                    /mcp-blueprint-results
                  </Link>.
                </p>
                <Link href="/login?next=%2Fmcp-test" className="mt-3 inline-flex text-neon-blue font-semibold hover:text-neon-green transition-colors">
                  Sign in →
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
