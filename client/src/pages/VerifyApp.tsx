import { useEffect, useMemo, useState } from 'react';
import { useRoute, Link } from 'wouter';
import { doc, onSnapshot, type Firestore } from 'firebase/firestore';
import { initializeFirebase, getFirestoreDb } from '@/lib/firebase';
import type { App } from '@shared/schema';
import { NoIndex } from '@/components/NoIndex';
import { SiteFooter } from '@/components/SiteFooter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { setPageSeo } from '@/utils/seo';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const PUBLIC_ORIGIN = 'https://stackapps.app';

export default function VerifyApp() {
  const [match, params] = useRoute('/verify/:id');
  const id = params?.id;
  const { toast } = useToast();

  const [app, setApp] = useState<App | null>(null);
  const [loading, setLoading] = useState(true);
  const [invalid, setInvalid] = useState(false);
  const [db, setDb] = useState<Firestore | null>(null);

  const embedHtml = useMemo(() => {
    if (!id) return '';
    return `<a href="${PUBLIC_ORIGIN}/verify/${id}">
  <img src="${PUBLIC_ORIGIN}/api/badge/${id}.svg" alt="Listed on StackApps" width="360">
</a>`;
  }, [id]);

  useEffect(() => {
    initializeFirebase()
      .then(() => {
        setDb(getFirestoreDb());
      })
      .catch((err) => {
        if (import.meta.env.DEV) console.error('Failed to init Firestore:', err);
        setInvalid(true);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!id || !db) return;

    setLoading(true);
    setInvalid(false);

    const appRef = doc(db, 'apps', id);
    const unsub = onSnapshot(
      appRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setApp(null);
          setInvalid(true);
          setLoading(false);
          return;
        }
        const data = snapshot.data();
        const moderation = data.moderationStatus;
        if (moderation !== 'approved' || data.status !== 'live') {
          setApp(null);
          setInvalid(true);
          setLoading(false);
          return;
        }
        setApp({
          id: snapshot.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          submittedAt:
            typeof data.submittedAt === 'string'
              ? data.submittedAt
              : data.submittedAt?.toDate?.()?.toISOString(),
        } as App);
        setInvalid(false);
        setLoading(false);
      },
      (err) => {
        if (import.meta.env.DEV) console.error('Error fetching app:', err);
        setApp(null);
        setInvalid(true);
        setLoading(false);
      },
    );

    return () => unsub();
  }, [id, db]);

  useEffect(() => {
    if (app && id) {
      setPageSeo(`Verified · ${app.name} · The Stackhouse`, `StackApps Verified badge status for ${app.name} on The Stackhouse.`);
      return;
    }
    if (loading && id) {
      setPageSeo('Verifying listing · The Stackhouse', 'Checking StackApps badge verification status.');
      return;
    }
    if (id) {
      setPageSeo('Badge not valid · The Stackhouse', 'This verification link is invalid or the listing is not live-approved.');
    }
  }, [app, loading, id]);

  const copyEmbed = async () => {
    if (!embedHtml) return;
    try {
      await navigator.clipboard.writeText(embedHtml);
      toast({ title: 'Copied', description: 'Embed code copied to clipboard.' });
    } catch {
      toast({
        title: 'Copy failed',
        description: 'Select the code and copy manually.',
        variant: 'destructive',
      });
    }
  };

  if (!id || !match) {
    return (
      <div className="min-h-screen bg-cyber-black flex flex-col">
        <NoIndex />
        <div className="flex flex-1 flex-col items-center justify-center px-4 pb-16">
          <Wordmark />
          <p className="text-xl font-semibold text-white">Badge Not Valid</p>
          <p className="mt-2 text-center text-gray-400 max-w-md">
            This verification link is missing a valid app ID.
          </p>
          <BackLink className="mt-8" />
        </div>
        <SiteFooter />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cyber-black flex flex-col">
        <NoIndex />
        <div className="flex flex-1 items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-blue" />
        </div>
        <SiteFooter />
      </div>
    );
  }

  if (invalid || !app) {
    return (
      <div className="min-h-screen bg-cyber-black flex flex-col">
        <NoIndex />
        <div className="flex flex-1 flex-col items-center justify-center px-4 pb-16">
          <Wordmark />
          <p className="text-xl font-semibold text-white">Badge Not Valid</p>
          <p className="mt-2 text-center text-gray-400 max-w-md">
            This badge does not match a live-approved listing on The Stackhouse, or the app could not be found.
          </p>
          <BackLink className="mt-8" />
        </div>
        <SiteFooter />
      </div>
    );
  }

  const listedRaw = app.submittedAt || app.createdAt;
  const listedDate = new Date(listedRaw).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-cyber-black flex flex-col">
      <NoIndex />
      <main className="flex-1 flex flex-col items-center px-4 py-12 md:py-16">
        <Wordmark />

        <div className="w-full max-w-lg flex flex-col items-center text-center">
          <CheckCircle2
            className="w-20 h-20 text-neon-green mb-6 drop-shadow-[0_0_24px_rgba(34,197,94,0.35)]"
            strokeWidth={1.5}
            aria-hidden
          />

          {app.thumbnailUrl ? (
            <div className="mb-6 w-40 rounded-xl overflow-hidden border border-cyber-light shadow-lg aspect-video bg-cyber-gray">
              <img src={app.thumbnailUrl} alt="" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="mb-6 w-40 aspect-video rounded-xl border border-cyber-light bg-cyber-gray flex items-center justify-center text-3xl font-bold text-cyber-light">
              {app.name.charAt(0)}
            </div>
          )}

          <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">{app.name}</h1>

          <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
            <span className="text-gray-300">StackApps Verified Badge</span>
            <Badge
              className={cn(
                'border-neon-green/50 bg-neon-green/15 text-neon-green',
              )}
            >
              Verified
            </Badge>
          </div>

          <p className="text-gray-400 text-sm md:text-base mb-8">
            Listed on The Stackhouse — {listedDate}
          </p>

          <Button
            asChild
            className="mb-10 bg-neon-blue text-black font-bold hover:bg-white shadow-[0_0_15px_rgba(0,243,255,0.2)]"
          >
            <Link href={`/app/${id}`}>View Full Listing</Link>
          </Button>

          <img src={`${PUBLIC_ORIGIN}/api/badge/${id}.svg`} alt="Listed on StackApps" className="w-72 max-w-full mb-8" />

          <div className="w-full text-left">
            <p className="text-sm font-medium text-gray-400 mb-2">Embed on your site</p>
            <div className="relative rounded-lg border border-cyber-light bg-cyber-gray/50 p-4 pr-24">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="absolute top-3 right-3"
                onClick={copyEmbed}
              >
                Copy
              </Button>
              <pre className="text-xs md:text-sm text-gray-300 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
                <code>{embedHtml}</code>
              </pre>
            </div>
          </div>

          <BackLink className="mt-10" />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Wordmark() {
  return (
    <a
      href={PUBLIC_ORIGIN}
      className="mb-10 flex flex-col items-center gap-0.5 group"
    >
      <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neon-blue to-neon-purple group-hover:from-neon-green group-hover:to-neon-blue transition-all duration-500">
        StackApps
      </span>
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
        The Stackhouse
      </span>
    </a>
  );
}

function BackLink({ className }: { className?: string }) {
  return (
    <a
      href={PUBLIC_ORIGIN}
      className={cn('text-neon-blue hover:text-white hover:underline text-sm font-medium transition-colors', className)}
    >
      ← stackapps.app
    </a>
  );
}
