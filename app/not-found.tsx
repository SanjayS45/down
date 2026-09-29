import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-serif text-4xl">Nothing here.</h1>
      <Link href="/" className="text-[var(--accent)] underline">
        Start a Down
      </Link>
    </div>
  );
}
