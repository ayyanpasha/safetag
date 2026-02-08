import { ShieldCheck } from "lucide-react";

export default function ScannerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-4 py-3">
        <div className="flex items-center gap-2 max-w-md mx-auto">
          <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
          <span className="font-semibold">SafeTag</span>
        </div>
      </header>
      <main id="main-content" className="px-4 py-8">
        {children}
      </main>
    </div>
  );
}
