import { PoolView } from "@/components/pool-view";

export default async function DownPage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = await params;
  return <PoolView address={address} />;
}
