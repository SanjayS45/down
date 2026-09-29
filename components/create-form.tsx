"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { parseEther } from "viem";
import {
  useAccount,
  useDeployContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { downAbi, downBytecode } from "@/lib/down";
import { txMessage } from "@/lib/errors";
import { defaultDeadlineLocal } from "@/lib/format";

export function CreateForm() {
  const router = useRouter();
  const { isConnected } = useAccount();
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("0.001");
  const [seats, setSeats] = useState("4");
  const [deadline, setDeadline] = useState("");
  const { deployContract, data: hash, isPending, error, reset } =
    useDeployContract();
  const receipt = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    const address = receipt.data?.contractAddress;
    if (address) router.push(`/d/${address}`);
  }, [receipt.data, router]);

  function submit(event: FormEvent) {
    event.preventDefault();
    reset();
    const seatsN = Number(seats);
    const lockAt = Math.floor(new Date(deadline).getTime() / 1000);
    deployContract({
      abi: downAbi,
      bytecode: downBytecode,
      args: [title.trim(), parseEther(amount), seatsN, lockAt],
    });
  }

  const busy = isPending || receipt.isLoading;

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <label className="field">
        <span>What’s this for?</span>
        <input
          required
          maxLength={80}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Airbnb in Santa Cruz"
        />
      </label>
      <div className="grid grid-cols-2 gap-4">
        <label className="field">
          <span>Each person puts down</span>
          <input
            required
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <em>ETH on Base Sepolia</em>
        </label>
        <label className="field">
          <span>How many people</span>
          <input
            required
            type="number"
            min={2}
            max={30}
            value={seats}
            onChange={(e) => setSeats(e.target.value)}
          />
        </label>
      </div>
      <label className="field">
        <span>Lock by</span>
        <input
          required
          type="datetime-local"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
        />
        <button
          type="button"
          className="self-start text-left text-sm text-[var(--muted)] underline"
          onClick={() => setDeadline(defaultDeadlineLocal())}
        >
          Use one week from now
        </button>
        <em>If it isn’t full by then, everyone is refunded.</em>
      </label>
      <button
        type="submit"
        className="btn btn-accent self-start"
        disabled={!isConnected || busy || !title.trim()}
      >
        {!isConnected
          ? "Connect to create"
          : busy
            ? "Opening…"
            : "Open a Down"}
      </button>
      {error ? <p className="error">{txMessage(error)}</p> : null}
      {receipt.error ? <p className="error">{txMessage(receipt.error)}</p> : null}
    </form>
  );
}
