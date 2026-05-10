import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { hasError: boolean };

/**
 * Catches render failures from the router tree, including rejected lazy() chunk
 * loads (e.g. network returns HTML for a .js URL). Without this, the root can
 * unmount and the user only sees a blank dark screen.
 */
export class RouteErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error("RouteErrorBoundary", error, info.componentStack);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-cyber-black px-6 text-center text-gray-200">
          <p className="text-lg font-medium text-white">Could not load the app</p>
          <p className="mt-2 max-w-sm text-sm text-gray-400">
            A script failed to load. This often means the site is updating. Try
            reloading once. If it keeps happening, clear stored data for this
            site or reinstall the PWA, then try again.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 rounded-md bg-neon-blue px-4 py-2 text-sm font-medium text-cyber-black"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
