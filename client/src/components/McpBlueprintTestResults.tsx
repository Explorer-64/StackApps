import { useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle, XCircle } from 'lucide-react';

export interface McpDiscoveryRound {
  stepsToFind: number;
  wrongServersInspected: string[];
  foundCorrectServer: boolean;
  toolSelected: string;
  reasoning: string;
  steps?: string[];
}

export interface McpTestResult {
  task: string;
  model: string;
  withoutBlueprint: McpDiscoveryRound;
  withBlueprint: McpDiscoveryRound;
  naiveRun?: McpDiscoveryRound;
  verdict: string;
  naiveVerdict?: string;
}

function itemPoints(item: string): number {
  const u = item.toLowerCase();
  if (u.endsWith('/llms.txt')) return 10;
  if (u.endsWith('/sitemap.xml')) return 3;
  if (u.endsWith('/robots.txt')) return 1;
  if (u.endsWith('/blueprint.txt')) return 1;
  if (u.includes('/blueprints/') && u.endsWith('.txt')) return 1;
  if (u.startsWith('http')) return 1;
  return 3; // get_server_tools call
}

function RoundCard({ round, label }: { round: McpDiscoveryRound; label: string }) {
  const [open, setOpen] = useState(false);
  const [reasoningOpen, setReasoningOpen] = useState(false);

  return (
    <div className="bg-cyber-black border border-cyber-light rounded-lg p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-bold text-white text-sm">{label}</h3>
        <span className={`text-xs font-bold px-2 py-0.5 rounded shrink-0 ${
          round.foundCorrectServer
            ? 'bg-neon-green/10 text-neon-green border border-neon-green/30'
            : 'bg-red-500/10 text-red-400 border border-red-500/30'
        }`}>
          {round.foundCorrectServer ? 'Concluded' : 'Timed out / missed'}
        </span>
      </div>


      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Context overhead (~pts)</span>
          <span className="text-white font-mono">{round.stepsToFind}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Resources inspected</span>
          <span className="text-white font-mono">{round.wrongServersInspected.length}</span>
        </div>
      </div>

      {round.wrongServersInspected.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-200 transition-colors"
          >
            {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            Overhead breakdown
          </button>
          {open && (
            <ul className="mt-2 space-y-1 pl-3 border-l border-cyber-light">
              {round.wrongServersInspected.map((item, i) => (
                <li key={i} className="text-xs text-gray-400 flex items-start gap-2">
                  <span className="shrink-0 text-neon-yellow font-mono">+{itemPoints(item)}</span>
                  <span className="font-mono break-all">{item}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {(round.steps && round.steps.length > 0) && (
        <div>
          <button
            type="button"
            onClick={() => setReasoningOpen((v) => !v)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-200 transition-colors"
          >
            {reasoningOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            Agent steps ({round.steps.length})
          </button>
          {reasoningOpen && (
            <ol className="mt-2 space-y-3 pl-3 border-l border-cyber-light">
              {round.steps.map((step, i) => (
                <li key={i} className="text-xs text-gray-400 leading-relaxed">
                  <span className="text-neon-blue font-mono shrink-0 mr-2">Step {i + 1}</span>
                  <span className="whitespace-pre-wrap">{step}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      <div className="pt-3 border-t border-cyber-light">
        <div className="flex items-center gap-2 text-sm">
          {round.foundCorrectServer ? (
            <CheckCircle className="h-4 w-4 text-neon-green shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 text-red-500 shrink-0" />
          )}
          <span className="text-gray-300">
            {round.foundCorrectServer ? 'Correct server found' : 'Did not find correct server'}
          </span>
        </div>
      </div>
    </div>
  );
}

function verdictStyle(verdict: string): string {
  if (verdict.includes('eliminated') || verdict.includes('reduced')) {
    return 'border-neon-green/40 bg-neon-green/10 text-neon-green';
  }
  if (verdict.includes('regression') || verdict.includes('did not conclude')) {
    return 'border-red-500/40 bg-red-500/10 text-red-400';
  }
  return 'border-neon-yellow/40 bg-neon-yellow/10 text-neon-yellow';
}

export function McpBlueprintTestResults({ result }: { result: McpTestResult }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <RoundCard round={result.withoutBlueprint} label="Run A — Without blueprint (guided)" />
        <RoundCard round={result.withBlueprint} label="Run B — With blueprint (guided)" />
      </div>

      <div className={`rounded-xl border p-5 ${verdictStyle(result.verdict)}`}>
        <p className="font-bold text-xs uppercase tracking-widest mb-1 opacity-70">Guided verdict</p>
        <p className="text-sm leading-relaxed">{result.verdict}</p>
      </div>

      {result.naiveRun && (
        <>
          <div className="border-t border-cyber-light pt-6">
            <p className="text-sm font-bold text-white mb-1">Run C — With blueprint, no guidance</p>
            <p className="text-xs text-gray-500 mb-4">
              Agent given only the task and server list. No instructions to look for robots.txt, blueprint.txt, or any specific discovery workflow. Does it find and use the blueprint on its own?
            </p>
            <RoundCard round={result.naiveRun} label="Run C — Agent discovers independently" />
          </div>

          {result.naiveVerdict && (
            <div className={`rounded-xl border p-5 ${verdictStyle(result.naiveVerdict)}`}>
              <p className="font-bold text-xs uppercase tracking-widest mb-1 opacity-70">
                Adoption verdict — Run C vs Run A
              </p>
              <p className="text-sm leading-relaxed">{result.naiveVerdict}</p>
              <p className="text-xs text-gray-500 mt-3">
                If Run C overhead ≈ Run B, the agent discovered the blueprint naturally — no adoption needed.
                If Run C overhead ≈ Run A, the agent ignored it — adoption is required before benefit happens.
              </p>
            </div>
          )}
        </>
      )}

      <div className="rounded-lg border border-cyber-light bg-cyber-dark/60 p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-300">How overhead points work</p>
        <p className="text-xs text-gray-400 leading-relaxed">
          Each resource an agent reads costs points based on its size. Without a blueprint, agents
          typically read <span className="text-neon-yellow font-mono">llms.txt</span> (+10 pts) to understand what a server does.
          With a blueprint, they read <span className="text-neon-green font-mono">blueprint.txt</span> (+1 pt) instead — a purpose-built,
          compact declaration of exactly what the server does and how to use it. Lower overhead means
          the agent reached the right answer having read less.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1 pt-1">
          {[
            ['+1', 'robots.txt'],
            ['+1', 'blueprint.txt'],
            ['+1', 'blueprints/*.txt'],
            ['+3', 'sitemap.xml'],
            ['+3', 'get_server_tools'],
            ['+10', 'llms.txt'],
          ].map(([pts, label]) => (
            <div key={label} className="flex items-center gap-2 text-xs">
              <span className="text-neon-yellow font-mono shrink-0">{pts}</span>
              <span className="text-gray-400">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
