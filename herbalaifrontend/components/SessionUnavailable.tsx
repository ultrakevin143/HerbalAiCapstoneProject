export default function SessionUnavailable({ retry }: { retry: () => void }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas px-6 text-center text-ink">
      <h1 className="text-2xl font-semibold">Connection interrupted</h1>
      <p className="max-w-md text-muted">We could not check your session. Your account has not been signed out.</p>
      <button className="rounded-xl bg-forest px-5 py-3 font-semibold text-white" onClick={retry}>Try again</button>
    </main>
  );
}
