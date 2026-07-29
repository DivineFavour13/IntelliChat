import ChatWindow from "@/components/ChatWindow";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-10 sm:py-16">
      <div className="w-full max-w-2xl flex flex-col gap-6">
        <header className="flex items-baseline justify-between">
          <h1 className="text-xl font-semibold tracking-tight">IntelliChat</h1>
          <span className="font-mono text-xs text-muted">v0.1 — website</span>
        </header>

        <ChatWindow />
      </div>
    </main>
  );
}
