import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-4">Automation Dashboard</h1>
        <p className="text-lg mb-6">Next.js project initialized successfully!</p>
        <Button>Test shadcn/ui Button</Button>
      </div>
    </main>
  );
}

