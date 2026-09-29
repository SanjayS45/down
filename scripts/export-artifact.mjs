import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const artifact = JSON.parse(
  readFileSync(join(root, "contracts/out/Down.sol/Down.json"), "utf8"),
);

const bytecode = artifact.bytecode.object;
if (!bytecode || bytecode === "0x") {
  throw new Error("Missing bytecode in Down artifact");
}

writeFileSync(
  join(root, "lib/down.ts"),
  `export const downAbi = ${JSON.stringify(artifact.abi, null, 2)} as const;\n\nexport const downBytecode = "${bytecode}" as \`0x\${string}\`;\n`,
);

console.log("wrote lib/down.ts");
