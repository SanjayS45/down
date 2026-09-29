import Link from "next/link";
import { ConnectButton } from "@/components/connect-button";

export function Header() {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-[var(--line)] px-6 py-4">
      <Link href="/" className="font-serif text-2xl tracking-tight">
        Down.
      </Link>
      <ConnectButton />
    </header>
  );
}
