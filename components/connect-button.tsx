"use client";

import { useState } from "react";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { chain } from "@/lib/wagmi";
import { shortAddress } from "@/lib/format";

export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const chainId = useAccount().chainId;
  const { connectors, connect, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: switching } = useSwitchChain();
  const [open, setOpen] = useState(false);

  if (isConnected && address && chainId !== chain.id) {
    return (
      <button
        type="button"
        className="btn btn-accent"
        disabled={switching}
        onClick={() => switchChain({ chainId: chain.id })}
      >
        {switching ? "Switching…" : "Switch to Base Sepolia"}
      </button>
    );
  }

  if (isConnected && address) {
    return (
      <button type="button" className="btn" onClick={() => disconnect()}>
        {shortAddress(address)}
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        className="btn btn-accent"
        onClick={() => setOpen((v) => !v)}
      >
        Connect
      </button>
      {open ? (
        <div className="absolute right-0 z-20 mt-2 w-56 border border-[var(--line)] bg-[var(--panel)] p-2">
          {connectors.map((connector) => (
            <button
              key={connector.uid}
              type="button"
              className="block w-full px-3 py-2 text-left text-sm hover:bg-[var(--fill)]"
              disabled={isPending}
              onClick={() => {
                connect({ connector, chainId: chain.id });
                setOpen(false);
              }}
            >
              {connector.name}
            </button>
          ))}
          {error ? (
            <p className="px-3 pt-2 text-xs text-[var(--danger)]">
              {error.message}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
