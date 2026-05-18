import { Link } from 'wouter';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface Props {
  whatItIs: string;
  whyWeCheck: string;
  guideHref?: string;
}

export function ReadinessCheckHint({ whatItIs, whyWeCheck, guideHref }: Props) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-cyber-light bg-cyber-dark text-[11px] font-bold text-gray-400 hover:border-neon-blue hover:text-neon-blue focus:outline-none focus:ring-2 focus:ring-neon-blue/40"
          aria-label="Explain this check"
        >
          ?
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="w-[min(100vw-2rem,22rem)] border-cyber-light bg-cyber-black p-4 text-sm text-gray-200 shadow-lg"
      >
        <p className="text-gray-300">
          <span className="font-semibold text-white">What it is: </span>
          {whatItIs}
        </p>
        <p className="mt-2 text-gray-300">
          <span className="font-semibold text-white">Why we check it: </span>
          {whyWeCheck}
        </p>
        {guideHref ? (
          <p className="mt-3 pt-3 border-t border-cyber-light/60">
            <Link
              href={guideHref}
              className="text-neon-blue hover:underline text-xs font-semibold uppercase tracking-wide"
            >
              Short guide →
            </Link>
          </p>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
