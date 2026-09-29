"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import {
  useAccount,
  usePublicClient,
  useReadContract,
  useWriteContract,
} from "wagmi";
import { isAddress, type Address } from "viem";
import { downAbi } from "@/lib/down";
import { txMessage } from "@/lib/errors";
import { formatDeadline, formatEth, shortAddress } from "@/lib/format";
import { explorerAddress, faucetUrl } from "@/lib/wagmi";

type PoolViewProps = {
  address: string;
};

function subscribeNow(onStoreChange: () => void) {
  const id = setInterval(onStoreChange, 1000);
  return () => clearInterval(id);
}

function getNow() {
  return Date.now() / 1000;
}

export function PoolView({ address }: PoolViewProps) {
  const valid = isAddress(address);
  const pool = valid ? (address as Address) : undefined;
  const { address: me, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data, error, refetch, isLoading } = useReadContract({
    address: pool,
    abi: downAbi,
    functionName: "getState",
    query: { enabled: Boolean(pool), refetchInterval: 4000 },
  });
  const { writeContractAsync, isPending } = useWriteContract();
  const [copied, setCopied] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(false);
  const now = useSyncExternalStore(subscribeNow, getNow, () => 0);

  const state = useMemo(() => {
    if (!data) return null;
    const [
      booker,
      title,
      amountPerSeat,
      seatsRequired,
      seatsFilled,
      deadline,
      closed,
      people,
    ] = data;
    return {
      booker,
      title,
      amountPerSeat,
      seatsRequired: Number(seatsRequired),
      seatsFilled: Number(seatsFilled),
      deadline: Number(deadline),
      closed,
      people,
    };
  }, [data]);

  const busy = isPending || waiting;

  async function run(send: () => Promise<`0x${string}`>) {
    if (!publicClient) return;
    setTxError(null);
    setWaiting(true);
    try {
      const hash = await send();
      await publicClient.waitForTransactionReceipt({ hash });
      await refetch();
    } catch (err) {
      setTxError(txMessage(err));
    } finally {
      setWaiting(false);
    }
  }

  if (!valid) {
    return <p className="error">That link isn’t a contract address.</p>;
  }

  if (isLoading && !state) {
    return <p className="muted">Loading…</p>;
  }

  if (error || !state) {
    return (
      <p className="error">
        Nothing on-chain at this address on Base Sepolia.
      </p>
    );
  }

  const full = state.seatsFilled >= state.seatsRequired;
  const past = now >= state.deadline;
  const inPool = me
    ? state.people.some((p) => p.toLowerCase() === me.toLowerCase())
    : false;
  const isBooker = me
    ? state.booker.toLowerCase() === me.toLowerCase()
    : false;

  let status = "Open";
  if (state.closed && full) status = "Paid out";
  else if (state.closed) status = "Refunded";
  else if (full) status = "Full — booker can take the pot";
  else if (past) status = "Missed the lock";

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="kicker">{status}</p>
        <h1 className="font-serif text-4xl leading-tight tracking-tight md:text-5xl">
          {state.title}
        </h1>
        <p className="mt-3 text-[var(--muted)]">
          {formatEth(state.amountPerSeat)} ETH each · {state.seatsFilled}/
          {state.seatsRequired} in · locks {formatDeadline(state.deadline)}
        </p>
      </div>

      <div className="h-2 w-full bg-[var(--fill)]">
        <div
          className="h-2 bg-[var(--accent)]"
          style={{
            width: `${Math.min(100, (state.seatsFilled / state.seatsRequired) * 100)}%`,
          }}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="btn"
          onClick={async () => {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ? "Copied" : "Copy link"}
        </button>
        <a
          className="btn"
          href={explorerAddress(pool!)}
          target="_blank"
          rel="noreferrer"
        >
          Basescan
        </a>
        <a className="btn" href={faucetUrl} target="_blank" rel="noreferrer">
          Testnet faucet
        </a>
      </div>

      <section>
        <h2 className="mb-3 text-sm uppercase tracking-wide text-[var(--muted)]">
          In
        </h2>
        {state.people.length === 0 ? (
          <p className="muted">Nobody yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {state.people.map((person) => (
              <li
                key={person}
                className="flex items-center gap-2 font-mono text-sm"
              >
                {shortAddress(person)}
                {person.toLowerCase() === state.booker.toLowerCase() ? (
                  <span className="tag">booker</span>
                ) : null}
                {me && person.toLowerCase() === me.toLowerCase() ? (
                  <span className="tag">you</span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex flex-wrap gap-3">
        {!state.closed && !full && !past ? (
          <button
            type="button"
            className="btn btn-accent"
            disabled={!isConnected || inPool || busy}
            onClick={() =>
              run(() =>
                writeContractAsync({
                  address: pool!,
                  abi: downAbi,
                  functionName: "chipIn",
                  value: state.amountPerSeat,
                }),
              )
            }
          >
            {inPool
              ? "You’re in"
              : `Chip in ${formatEth(state.amountPerSeat)} ETH`}
          </button>
        ) : null}

        {!state.closed && inPool && !full ? (
          <button
            type="button"
            className="btn"
            disabled={busy}
            onClick={() =>
              run(() =>
                writeContractAsync({
                  address: pool!,
                  abi: downAbi,
                  functionName: "dropOut",
                }),
              )
            }
          >
            Drop out
          </button>
        ) : null}

        {!state.closed && full && isBooker ? (
          <button
            type="button"
            className="btn btn-accent"
            disabled={busy}
            onClick={() =>
              run(() =>
                writeContractAsync({
                  address: pool!,
                  abi: downAbi,
                  functionName: "withdraw",
                }),
              )
            }
          >
            Take the pot
          </button>
        ) : null}

        {!state.closed && past && !full ? (
          <button
            type="button"
            className="btn btn-accent"
            disabled={!isConnected || busy}
            onClick={() =>
              run(() =>
                writeContractAsync({
                  address: pool!,
                  abi: downAbi,
                  functionName: "refundAll",
                }),
              )
            }
          >
            Refund everyone
          </button>
        ) : null}
      </div>

      {txError ? <p className="error">{txError}</p> : null}
    </div>
  );
}
