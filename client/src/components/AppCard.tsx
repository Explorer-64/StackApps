import type { App } from '@shared/schema';
import { Link } from 'wouter';
import { getPwaBadge, getReadinessTier, hasBlueprint, readinessTierBadgeClassName, readinessTierLabel } from '@/utils/scanBadges';

interface Props {
  app: App;
}

export function AppCard({ app }: Props) {
  const isBuilding = app.status === 'building';
  const isLiveApproved = app.status === 'live' && app.moderationStatus === 'approved';
  const hasScan = Boolean(app.scan_timestamp);
  const tier = hasScan ? getReadinessTier(app) : null;
  const pwaBadge = hasScan ? getPwaBadge(app) : null;
  const blueprint = hasScan && hasBlueprint(app) && tier !== 'gold';
  
  return (
    <Link href={`/app/${app.id}`} className="block h-full group" data-testid={`card-app-${app.id}`} data-agent-id={`app-card-${app.id}`}>
      <div className="bg-cyber-gray rounded-2xl shadow-lg hover:shadow-[0_0_28px_rgba(57,255,20,0.16)] hover:border-neon-green/70 transition-all duration-300 overflow-hidden border border-cyber-light flex flex-col h-full">
        <div className="h-64 bg-cyber-black relative overflow-hidden flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gradient-to-br from-neon-blue/5 via-transparent to-neon-green/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          {app.thumbnailUrl ? (
            <img
              src={app.thumbnailUrl}
              alt={app.name}
              loading="lazy"
              className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="text-6xl text-cyber-light font-bold select-none group-hover:text-neon-green transition-colors">{app.name.charAt(0)}</div>
          )}
          {isBuilding && (
            <div className="absolute top-2 right-2 bg-yellow-900/80 border border-yellow-500 text-yellow-200 text-xs font-bold px-2 py-1 rounded-sm shadow-sm z-10">
              BUILDING
            </div>
          )}
          {isLiveApproved && (
            <div className="absolute top-2 right-2 bg-green-900/80 border border-neon-green/60 text-neon-green text-xs font-bold px-2 py-1 rounded-sm shadow-sm z-10">
              LIVE
            </div>
          )}
          {app.isFeatured && (
             <div className="absolute top-2 left-2 bg-neon-purple/20 border border-neon-purple text-neon-purple text-xs font-bold px-2 py-1 rounded-sm shadow-sm z-10 backdrop-blur-sm">
               FEATURED
             </div>
          )}
        </div>

        <div className="p-6 flex flex-col flex-grow">
          <div className="flex justify-between items-start mb-2 gap-2">
            <h3 className="text-xl font-bold text-white group-hover:text-neon-green transition-colors line-clamp-1" data-testid={`text-app-name-${app.id}`}>{app.name}</h3>
            {app.averageRating ? (
               <div className="flex items-center bg-cyber-black border border-cyber-light px-2 py-1 rounded flex-shrink-0">
                 <span className="text-neon-yellow mr-1">★</span>
                 <span className="text-sm font-bold text-gray-300">{app.averageRating.toFixed(1)}</span>
               </div>
            ) : null}
          </div>
          
          <p className="text-gray-400 mb-4 line-clamp-2 text-sm flex-grow">{app.description}</p>
          {hasScan && (tier || pwaBadge || blueprint) && (
            <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
              {tier && (
                <span
                  className={`inline-flex items-center rounded-sm border px-2 py-1 text-xs font-bold ${readinessTierBadgeClassName(tier)}`}
                >
                  {readinessTierLabel(tier).name} · {readinessTierLabel(tier).tagline}
                </span>
              )}
              {pwaBadge && (
                <span
                  className="inline-flex items-center rounded-sm px-2 py-1 text-xs font-bold text-white"
                  style={{ backgroundColor: pwaBadge === 'green' ? '#15803d' : '#b45309' }}
                >
                  {pwaBadge === 'green' ? 'PWA Ready' : 'PWA Partial'}
                </span>
              )}
              {blueprint && (
                <span
                  className="inline-flex items-center rounded-sm px-2 py-1 text-xs font-bold text-white"
                  style={{ backgroundColor: '#1d4ed8' }}
                >
                  Blueprint
                </span>
              )}
            </div>
          )}
          
          <div className="flex flex-wrap gap-2 mt-auto">
            {app.category && (
              <span className="px-2 py-1 bg-cyber-light text-gray-300 border border-cyber-light text-xs rounded-sm font-medium">
                {app.category}
              </span>
            )}
            {app.tags?.slice(0, 2).map((tag) => (
              <span key={tag} className="px-2 py-1 bg-neon-blue/10 text-neon-blue border border-neon-blue/30 text-xs rounded-sm font-medium">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
