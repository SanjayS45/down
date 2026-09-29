# Down

Friends lock a share before anyone books. If the group fills, the booker takes the pot. If the deadline hits first, anyone can refund everyone.

This runs on Base Sepolia. Get test ETH from the [Alchemy faucet](https://www.alchemy.com/faucets/base-sepolia).

```
npm install
npm run dev
```

Contract tests:

```
forge test --root contracts
```

After changing `contracts/src/Down.sol`:

```
npm run export:abi
```
