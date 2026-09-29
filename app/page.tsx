import { CreateForm } from "@/components/create-form";

export default function Home() {
  return (
    <div className="flex flex-col gap-12">
      <section className="flex flex-col gap-4">
        <h1 className="font-serif text-5xl leading-[1.05] tracking-tight md:text-6xl">
          I’m down.
        </h1>
        <p className="max-w-md text-lg leading-relaxed text-[var(--muted)]">
          Don’t be the bank. Friends lock their share before anyone books.
          Hit the count, you take the pot. Miss it, everyone gets refunded.
        </p>
      </section>
      <CreateForm />
      <ol className="flex flex-col gap-4 text-[var(--muted)]">
        <li>
          <strong className="text-[var(--foreground)]">1. Open.</strong> Name
          the plan, set the amount, the headcount, and a deadline.
        </li>
        <li>
          <strong className="text-[var(--foreground)]">2. Chip in.</strong>{" "}
          Send the link. Each person deposits the same amount on Base Sepolia.
        </li>
        <li>
          <strong className="text-[var(--foreground)]">3. Fill or fail.</strong>{" "}
          Full: the booker withdraws and books. Not full: refund everyone.
        </li>
      </ol>
    </div>
  );
}
