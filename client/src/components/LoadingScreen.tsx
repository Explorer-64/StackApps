export function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-cyber-black gap-4">
      <div className="text-2xl font-bold tracking-widest text-neon-blue uppercase">StackApps</div>
      <div className="w-8 h-8 rounded-full border-2 border-neon-blue border-t-transparent animate-spin" />
    </div>
  );
}
