import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center text-center px-4">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="text-xl text-muted-foreground mt-4">Page not found</p>
      <Button asChild className="mt-8 min-h-[44px]">
        <Link href="/">Go Home</Link>
      </Button>
    </main>
  );
}
