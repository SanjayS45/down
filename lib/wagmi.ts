import { http, createConfig } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { baseAccount, injected } from "wagmi/connectors";

const rpc = process.env.NEXT_PUBLIC_RPC_URL || "https://sepolia.base.org";

export const config = createConfig({
  chains: [baseSepolia],
  connectors: [
    baseAccount({ appName: "Down" }),
    injected({ shimDisconnect: true }),
  ],
  transports: {
    [baseSepolia.id]: http(rpc),
  },
  ssr: true,
});

export const chain = baseSepolia;
export const faucetUrl = "https://www.alchemy.com/faucets/base-sepolia";
export const explorerTx = (hash: `0x${string}`) =>
  `https://sepolia.basescan.org/tx/${hash}`;
export const explorerAddress = (address: `0x${string}`) =>
  `https://sepolia.basescan.org/address/${address}`;
