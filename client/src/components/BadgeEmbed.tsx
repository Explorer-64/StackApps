import { useMemo, useState } from 'react';

export function BadgeEmbed({ appId, isOwner }: { appId: string; isOwner: boolean }) {
  const [copied, setCopied] = useState(false);
  const badgeUrl = `https://stackapps.app/badge/${appId}.svg`;
  const embedCode = useMemo(
    () => `<img src="${badgeUrl}" alt="Listed on StackApps" />`,
    [badgeUrl],
  );

  if (!isOwner) {
    return null;
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(embedCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section
      className="bg-cyber-gray rounded-xl shadow-lg border border-cyber-light p-6 md:p-8 mb-8"
      data-agent-id="badge-embed-section"
    >
      <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Embed your badge</h2>
          <p className="text-gray-400 text-sm mt-1">Show your StackApps badge status on your site. Live-approved, StackApps verified apps display the verified state.</p>
        </div>
      </div>

      <div className="bg-cyber-black border border-cyber-light rounded-lg p-4 mb-4 inline-block">
        <img src={badgeUrl} alt="Listed on StackApps" className="max-w-full h-auto" />
      </div>

      <div className="bg-cyber-black border border-cyber-light rounded-lg overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-cyber-light px-4 py-2">
          <span className="text-xs font-bold uppercase tracking-wide text-gray-500">Embed code</span>
          <button
            type="button"
            onClick={handleCopy}
            className="bg-neon-blue text-black text-xs font-bold px-3 py-1 rounded-sm hover:bg-white transition-colors"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <pre className="p-4 text-sm text-gray-300 select-all overflow-x-auto">
          <code>{embedCode}</code>
        </pre>
      </div>
    </section>
  );
}
