import { formatEther, type Address } from "viem";

export function shortAddress(address: Address) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function formatEth(value: bigint) {
  const asNumber = Number(formatEther(value));
  if (!Number.isFinite(asNumber)) return formatEther(value);
  return asNumber.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

export function formatDeadline(unix: number) {
  return new Date(unix * 1000).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function toDatetimeLocal(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function defaultDeadlineLocal() {
  return toDatetimeLocal(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
}
